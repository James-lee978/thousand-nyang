"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export function WelcomeModal() {
  const { userProfile } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("hasSeenWelcome") === "true";
  });
  const isVisible = !hasSeenWelcome && Boolean(userProfile?.nickname);

  useEffect(() => {
    if (!isVisible) return;

    const timer = window.setTimeout(() => {
      localStorage.setItem("hasSeenWelcome", "true");
      setHasSeenWelcome(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [isVisible]);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setHasSeenWelcome(true);
  };

  if (hasSeenWelcome || !userProfile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mx-4 max-w-2xl space-y-8 text-center"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.p
              className="text-xs uppercase tracking-[0.5em] text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Welcome
            </motion.p>

            <motion.h1
              className="text-5xl font-light tracking-tight text-white sm:text-7xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {userProfile.nickname}님
            </motion.h1>

            <motion.p
              className="text-xl leading-relaxed text-zinc-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              1000냥 전시회에 오신 것을 환영합니다.
            </motion.p>

            <motion.p
              className="text-lg leading-relaxed text-zinc-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              당신의 예술과 감각을 전시하고
              <br />
              다른 사람의 전시를 천천히 둘러보세요.
            </motion.p>

            <motion.button
              type="button"
              onClick={handleClose}
              className="mt-8 border border-white/30 px-8 py-3 text-xs uppercase tracking-[0.2em] text-white transition-all duration-500 hover:bg-white hover:text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              시작하기
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
