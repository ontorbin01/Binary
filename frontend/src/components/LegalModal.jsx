import React from "react";
import { X, ShieldCheck } from "lucide-react";

export default function LegalModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div data-testid="legal-modal" className="relative w-full max-w-lg bg-brand-cream sm:rounded-3xl max-h-[92vh] overflow-y-auto scrollbar-none animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-brand-green text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold"><ShieldCheck className="w-5 h-5 text-amber-400" /> গোপনীয়তা নীতি ও এসক্রো শর্তাবলী</div>
          <button onClick={onClose} data-testid="legal-close-btn"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-5 space-y-5 text-sm text-slate-700 leading-relaxed">
          <Section title="১. গোপনীয়তা নীতি">
            গ্রামেরঘর বিডি আপনার ব্যক্তিগত তথ্য (নাম, মোবাইল নম্বর, ঠিকানা) শুধুমাত্র অর্ডার প্রক্রিয়াকরণ ও ডেলিভারির জন্য ব্যবহার করে। আমরা আপনার তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না। আপনার পেমেন্ট তথ্য সুরক্ষিতভাবে সংরক্ষণ করা হয়।
          </Section>
          <Section title="২. এসক্রো সুরক্ষা ব্যবস্থা">
            পচনশীল পণ্যের (মাছ, দুধ, তাজা ফল) ক্ষেত্রে ৫০% অগ্রিম এসক্রো পেমেন্ট গ্রামেরঘর বিডি'র কাছে নিরাপদে জমা থাকে। ক্রেতা পণ্য বুঝে পাওয়ার পরই বিক্রেতা তার প্রাপ্য টাকা পান। এতে উভয় পক্ষের স্বার্থ সুরক্ষিত থাকে।
          </Section>
          <Section title="৩. হাইপার-লোকাল ডেলিভারি নিয়ম">
            পচনশীল পণ্য শুধুমাত্র বিক্রেতার নিজ ও পার্শ্ববর্তী জেলায় ৩-৬ ঘণ্টার মধ্যে ডেলিভারি নিশ্চিত থাকলেই অর্ডার গ্রহণ করা হয়। মান নিয়ন্ত্রণের জন্য এটি বাধ্যতামূলক।
          </Section>
          <Section title="৪. অপচনশীল পণ্য ও ডেলিভারি চার্জ">
            মধু, ঘি, তেল, চাল ইত্যাদি অপচনশীল পণ্য কুরিয়ার/লোকাল শিপিংয়ে পাঠানো হয়। অর্ডার নিশ্চিত করতে ৳১০০ অগ্রিম ডেলিভারি চার্জ টোকেন বিকাশ/নগদে পরিশোধ করতে হয়, বাকি টাকা ক্যাশ অন ডেলিভারিতে দেওয়া যায়।
          </Section>
          <Section title="৫. পেমেন্ট ও TrxID যাচাই">
            সকল বিকাশ/নগদ পেমেন্টের TrxID অ্যাডমিন কর্তৃক যাচাই করা হয়। ভুল বা জাল TrxID দিলে অর্ডার বাতিল ও অ্যাকাউন্ট স্থগিত করা হতে পারে।
          </Section>
          <Section title="৬. মন্তব্য ও কনটেন্ট নীতি">
            সকল মন্তব্য স্বচ্ছতার জন্য উন্মুক্ত থাকে। বিক্রেতা সরাসরি মন্তব্য মুছতে পারেন না, তবে অনুপযুক্ত বা মিথ্যা মন্তব্য অ্যাডমিনের কাছে রিপোর্ট করতে পারেন। অ্যাডমিন যাচাই করে ব্যবস্থা নেন।
          </Section>
          <p className="text-xs text-slate-400 pt-2">সর্বশেষ হালনাগাদ: জুন ২০২৬ · গ্রামেরঘর বিডি</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-bold text-brand-green mb-1">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
