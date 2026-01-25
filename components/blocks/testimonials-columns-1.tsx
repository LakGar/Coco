"use client";
import React from "react";
import { motion } from "framer-motion";

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 shadow-lg shadow-amber-500/5 max-w-xs w-full hover:border-gray-300/50 transition-all duration-300"
                  key={`${index}-${i}`}
                >
                  <div className="text-gray-700 leading-relaxed mb-5">{text}</div>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 text-sm leading-tight">{name}</div>
                      <div className="text-xs text-gray-600 leading-tight">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
