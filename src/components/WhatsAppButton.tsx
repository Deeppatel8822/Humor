"use client";

export default function WhatsAppButton() {
  const phone = "919586233163";
  const message = encodeURIComponent(
    "Hi Humor Luxury! I need help choosing the right product/routine."
  );

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Humor Luxury on WhatsApp"
      className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg shadow-black/15 transition-all hover:scale-105 hover:shadow-xl md:bottom-6 md:right-6"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.5 3.5A11.8 11.8 0 0 0 12.06 0C5.55 0 .26 5.29.26 11.8c0 2.08.54 4.11 1.57 5.9L.18 23.94l6.39-1.67a11.77 11.77 0 0 0 5.49 1.36h.01c6.5 0 11.79-5.29 11.79-11.8 0-3.15-1.22-6.11-3.36-8.33ZM12.07 21.58h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.8 9.8 0 1 1 8.37 4.66Zm5.37-7.35c-.29-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.65.15-.19.29-.75.95-.92 1.15-.17.19-.34.22-.63.07-.29-.15-1.2-.44-2.29-1.41-.85-.76-1.42-1.7-1.59-1.99-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.58-.89-2.16-.23-.56-.47-.49-.65-.5h-.56c-.19 0-.51.07-.78.36-.27.29-1.02.99-1.02 2.42s1.05 2.81 1.19 3c.15.19 2.07 3.16 5.02 4.43.7.3 1.25.48 1.68.61.71.23 1.35.2 1.86.12.57-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.19-.56-.34Z" />
      </svg>
      <span className="hidden text-sm font-medium sm:inline">Chat with us</span>
    </a>
  );
}
