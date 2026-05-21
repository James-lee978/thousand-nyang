"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";

export function WelcomeModal() {
  const { userProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    // 이미 환영 메시지를 본 사용자인지 체크
    const seen = localStorage.getItem("hasSeenWelcome");
    if (seen) {
      setHasSeenWelcome(true);
      return;
    }

    // 사용자 프로필이 로드되면 환영 메시지 표시
    if (userProfile && userProfile.nickname) {
      setIsVisible(true);

      // 5초 후 자동 닫기
      const timer = setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem("hasSeenWelcome", "true");
        setHasSeenWelcome(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [userProfile]);

  const handleClose = () => {
    setIsVisible(false);
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
            className="mx-4 max-w-2xl text-center space-y-8"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs uppercase tracking-[0.5em] text-zinc-500">
                Welcome
              </p>
            </motion.div>
            
            <motion.h1
              className="text-5xl font-light tracking-tight text-white sm:text-7xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {userProfile.nickname}님
            </motion.h1>
            
            <motion.p
              className="text-xl text-zinc-300 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              환영합니다!
            </motion.p>
            
            <motion.p
              className="text-lg text-zinc-400 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              당신의 예술적 감각을 1000냥 전시회에서
              <br />
              키워보세요!
            </motion.p>

            <motion.button
              onClick={handleClose}
              className="mt-8 px-8 py-3 text-xs uppercase tracking-[0.2em] text-white border border-white/30 hover:bg-white hover:text-black transition-all duration-500"
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
