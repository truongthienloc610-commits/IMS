import { motion } from 'motion/react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-500">
      <div className="relative flex flex-col items-center">
        {/* Animated Background Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.3 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="w-32 h-32 rounded-full border-2 border-primary"
          />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.8, opacity: 0.1 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
            className="w-32 h-32 rounded-full border-2 border-primary"
          />
        </div>

        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 mb-12"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/2/20/FPT_Polytechnic.png" 
            alt="FPT Polytechnic" 
            className="h-24 md:h-28 object-contain"
          />
        </motion.div>

        {/* Loading Progress */}
        <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          />
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 tracking-widest uppercase"
        >
          Đang khởi tạo hệ thống...
        </motion.p>
      </div>
    </div>
  );
}
