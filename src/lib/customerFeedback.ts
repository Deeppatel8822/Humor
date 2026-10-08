import { Product } from "@/types/product";

export type CustomerFeedback = {
  name: string;
  state: string;
  rating: 4 | 5;
  text: string;
};

const pool: Record<string, CustomerFeedback[]> = {
  default: [
    { name: "Aarav Mehta", state: "Gujarat", rating: 5, text: "Loved it. Skin feels so much better!" },
    { name: "Priya Sharma", state: "Maharashtra", rating: 5, text: "Honestly, very nice product. Result noticeable after regular use." },
    { name: "Rohit Verma", state: "Delhi", rating: 4, text: "Good product, texture is really nice." },
    { name: "Neha Patel", state: "Rajasthan", rating: 5, text: "Bahut accha laga. Daily routine ka part ban gaya." },
    { name: "Kunal Shah", state: "Karnataka", rating: 5, text: "Great quality and the results are better than I expected." },
    { name: "Ananya Singh", state: "Uttar Pradesh", rating: 4, text: "Nice one ❤️ light and comfortable to use." },
    { name: "Vivek Joshi", state: "Madhya Pradesh", rating: 5, text: "Regular use se difference clearly feel hua." },
    { name: "Riya Das", state: "West Bengal", rating: 5, text: "Amazing!" },
    { name: "Manish Gupta", state: "Punjab", rating: 4, text: "Good experience so far. Will buy again." },
    { name: "Pooja Iyer", state: "Tamil Nadu", rating: 5, text: "Very happy with the product. Quality is genuinely impressive." },
    { name: "Harshil Desai", state: "Gujarat", rating: 5, text: "Fragrance, feel and overall result all good." },
    { name: "Sneha Nair", state: "Kerala", rating: 4, text: "Mujhe kaafi achha laga, especially after consistent use." },
  ],
  "repair-shampoo": [
    { name: "Rahul Mehta", state: "Gujarat", rating: 5, text: "Hair feels softer from the first few washes. Really liking it." },
    { name: "Kavya Rao", state: "Karnataka", rating: 5, text: "Frizz noticeably reduced. Baal manageable ho gaye." },
    { name: "Amit Sharma", state: "Delhi", rating: 4, text: "Good shampoo, nice fragrance and smooth finish." },
    { name: "Simran Kaur", state: "Punjab", rating: 5, text: "Dry hair ke liye kaafi useful laga. Love it!" },
    { name: "Nisha Patel", state: "Maharashtra", rating: 5, text: "After regular use my hair looks healthier and feels much softer." },
  ],
  "repair-conditioner": [
    { name: "Meera Shah", state: "Gujarat", rating: 5, text: "Super soft hair!" },
    { name: "Arjun Nair", state: "Kerala", rating: 4, text: "Conditioning is good and hair feels easy to comb." },
    { name: "Ishita Verma", state: "Uttar Pradesh", rating: 5, text: "Frizz control is actually noticeable. Very happy." },
    { name: "Rohan Kulkarni", state: "Maharashtra", rating: 5, text: "Nice texture, small quantity is enough." },
  ],
  "repair-hair-mask": [
    { name: "Shreya Joshi", state: "Rajasthan", rating: 5, text: "Hair feels deeply conditioned after the mask." },
    { name: "Dev Patel", state: "Gujarat", rating: 5, text: "Dry ends feel much better after regular use." },
    { name: "Aditi Sen", state: "West Bengal", rating: 4, text: "Kaafi achha hai, hair becomes smoother and softer." },
    { name: "Tanvi Rao", state: "Karnataka", rating: 5, text: "Loved the salon-like smooth finish." },
  ],
  "sunscreen-spf-50": [
    { name: "Priya Shah", state: "Gujarat", rating: 5, text: "Lightweight and non-greasy. Perfect for daily use." },
    { name: "Aditya Kapoor", state: "Delhi", rating: 5, text: "No heavy feeling and sits nicely on the skin." },
    { name: "Mansi Jain", state: "Rajasthan", rating: 4, text: "Daily sunscreen ke liye really comfortable." },
    { name: "Sonal Desai", state: "Maharashtra", rating: 5, text: "Skin feels protected without that sticky sunscreen feel." },
  ],
};

export function getCustomerFeedback(product: Product): CustomerFeedback[] {
  return pool[product.slug] ?? pool.default;
}