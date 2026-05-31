import { getServerFirestoreDb } from "@/firebase/server";
import type { NotificationQueueItem, User } from "@/types";
import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function getBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin ||
    "https://thousand-nyang.vercel.app"
  );
}

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER 또는 GMAIL_APP_PASSWORD 환경변수가 없습니다.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function makeSubject(item: NotificationQueueItem) {
  if (item.type === "comment") return "1000냥 전시회에 새 댓글이 달렸습니다";
  if (item.type === "exhibition_like") return "1000냥 전시회에 좋아요가 달렸습니다";
  if (item.type === "exhibition_dislike") return "1000냥 전시회에 싫어요 반응이 달렸습니다";
  if (item.type === "comment_like") return "1000냥 전시회 댓글에 좋아요가 달렸습니다";
  return "1000냥 전시회 댓글에 싫어요 반응이 달렸습니다";
}

function makeHtml(item: NotificationQueueItem, exhibitionUrl: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin:0 0 16px">1000냥 전시회 알림</h2>
      <p>${item.message}</p>
      <p style="color:#555">전시: <strong>${item.exhibitionTitle}</strong></p>
      <p>
        <a href="${exhibitionUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:999px">
          전시 보러가기
        </a>
      </p>
    </div>
  `;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServerFirestoreDb();
  const transporter = createTransporter();
  const snapshot = await db
    .collection("notificationQueue")
    .where("status", "==", "pending")
    .limit(20)
    .get();
  const baseUrl = getBaseUrl(request);
  const result = { sent: 0, skipped: 0, failed: 0 };

  for (const itemDoc of snapshot.docs) {
    const item = {
      id: itemDoc.id,
      ...(itemDoc.data() as Omit<NotificationQueueItem, "id">),
    };

    try {
      const hostSnap = await db.collection("users").doc(item.hostId).get();
      const host = hostSnap.exists ? (hostSnap.data() as User) : null;
      if (!host?.email) {
        await itemDoc.ref.update({
          status: "skipped",
          error: "작성자 이메일이 없습니다.",
          sentAt: new Date().toISOString(),
        });
        result.skipped += 1;
        continue;
      }

      const exhibitionUrl = `${baseUrl}/exhibition/${item.exhibitionId}`;
      await transporter.sendMail({
        from: `"1000냥 전시회" <${process.env.GMAIL_USER}>`,
        to: host.email,
        subject: makeSubject(item),
        text: `${item.message}\n\n전시 보러가기: ${exhibitionUrl}`,
        html: makeHtml(item, exhibitionUrl),
      });

      await itemDoc.ref.update({
        status: "sent",
        sentAt: new Date().toISOString(),
      });
      result.sent += 1;
    } catch (error) {
      const attempts = (item.attempts ?? 0) + 1;
      await itemDoc.ref.update({
        status: attempts >= 3 ? "failed" : "pending",
        attempts,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      result.failed += 1;
    }
  }

  return NextResponse.json({ ok: true, processed: snapshot.size, ...result });
}
