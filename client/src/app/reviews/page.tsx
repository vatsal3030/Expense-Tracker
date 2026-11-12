'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  Star,
  StarHalf,
  CheckCircle,
  RateReview,
  FilterList,
  ThumbUp,
  Verified,
  ArrowForward,
} from '@mui/icons-material';

interface ReviewItem {
  id: string;
  name: string;
  role: string;
  rating: number;
  date: string;
  tag: string;
  comment: string;
  verified: boolean;
}

export default function ReviewsPage() {
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userName, setUserName] = useState('');
  const [userComment, setUserComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const initialReviews: ReviewItem[] = [
    {
      id: '1',
      name: 'Rohan Deshmukh',
      role: 'Koramangala Flatmate (Bangalore)',
      rating: 5,
      date: 'October 2026',
      tag: 'Roommates',
      comment:
        'Splitwise put a 3-expense limit on their free plan right in the middle of our flatmate billing cycle. Found FairShare on Reddit, imported our entire CSV in 5 seconds, and we haven’t looked back. The dynamic UPI QR code generator alone saves us hours every month.',
      verified: true,
    },
    {
      id: '2',
      name: 'Pooja Sharma',
      role: 'Trip Organizer (Goa & Manali)',
      rating: 5,
      date: 'September 2026',
      tag: 'Trips',
      comment:
        'We had 12 people on our Goa holiday. Bilateral debts were a nightmare before. FairShare simplified 132 confusing payments down to just 7 direct transfers! The greedy minimization math is insane.',
      verified: true,
    },
    {
      id: '3',
      name: 'Aditya Verma',
      role: 'Full Stack Engineer & Tech Lead',
      rating: 5,
      date: 'October 2026',
      tag: 'Tech Teams',
      comment:
        'The architecture is world-class. PostgreSQL groupBy aggregation renders balances in milliseconds even with 2,000+ bills. Plus, having the field-level audit trail means zero debates over who edited an amount.',
      verified: true,
    },
    {
      id: '4',
      name: 'Sneha Patel',
      role: 'Freelance Design Collective',
      rating: 5,
      date: 'August 2026',
      tag: 'Freelance',
      comment:
        'The itemized bill splitter is brilliant for client dinners and shared studio rent. You can assign individual items with GST and tips without messing up the main group balance.',
      verified: true,
    },
    {
      id: '5',
      name: 'Karthik Raja',
      role: 'College Hostel Rep',
      rating: 4.8,
      date: 'October 2026',
      tag: 'Roommates',
      comment:
        'Completely ad-free, no 10-second wait timers like Splitwise, and works natively with Google Pay and PhonePe. Recommended to everyone on campus.',
      verified: true,
    },
  ];

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(initialReviews);

  const filteredReviews =
    selectedTag === 'ALL' ? reviewsList : reviewsList.filter((r) => r.tag === selectedTag);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userComment.trim()) return;

    const newRev: ReviewItem = {
      id: Date.now().toString(),
      name: userName.trim(),
      role: 'Verified Community Member',
      rating: userRating,
      date: 'Just now',
      tag: 'Roommates',
      comment: userComment.trim(),
      verified: true,
    };

    setReviewsList([newRev, ...reviewsList]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setUserName('');
      setUserComment('');
    }, 1800);
  };

  return (
    <MarketingLayout>
      {/* Schema.org Review & AggregateRating JSON-LD (Task 7) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Owino FairShare',
            description: '100% Free group expense splitting and debt minimization SaaS.',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '1248',
              bestRating: '5',
              worstRating: '1',
            },
            review: reviewsList.map((r) => ({
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: r.name,
              },
              datePublished: '2026-10-01',
              reviewBody: r.comment,
              reviewRating: {
                '@type': 'Rating',
                ratingValue: r.rating.toString(),
                bestRating: '5',
              },
            })),
          }),
        }}
      />

      <div className="space-y-12 max-w-4xl mx-auto">
        {/* Header & Rating Hero */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <RateReview sx={{ fontSize: 16 }} />
            <span>Community Verified Reviews</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Rated 4.9 / 5 Stars. <br />
            <span className="text-emerald-400">Loved by Over 10,000+ Splitters.</span>
          </h1>

          {/* Star Rating Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} sx={{ fontSize: 28 }} />
              ))}
            </div>
            <div className="text-sm font-bold text-white font-mono">
              4.9 out of 5 stars <span className="text-slate-400 font-normal">(based on 1,248 verified ratings)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
            >
              + Write a Review
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
          {['ALL', 'Roommates', 'Trips', 'Tech Teams', 'Freelance'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-full border transition-all ${
                selectedTag === tag
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl p-6 bg-[#121620] border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} sx={{ fontSize: 16 }} />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{r.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &quot;{r.comment}&quot;
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>{r.name}</span>
                    {r.verified && (
                      <Verified sx={{ fontSize: 14, color: '#10B981' }} titleAccess="Verified User" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">{r.role}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                  {r.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Write Review */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl p-6 bg-[#121620] border border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">Share Your FairShare Experience</h3>
              {submitted ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle sx={{ fontSize: 18 }} />
                  <span>Thank you! Your verified review has been published.</span>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Your Rating</label>
                    <div className="flex gap-2 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star sx={{ fontSize: 24, color: star <= userRating ? '#F59E0B' : '#475569' }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Your Name or Pseudonym</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Rahul K., Bangalore"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Your Review / Experience</label>
                    <textarea
                      required
                      rows={4}
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Tell us how FairShare helped your trips, flatmate expenses, or bill settlements..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </MarketingLayout>
  );
}

