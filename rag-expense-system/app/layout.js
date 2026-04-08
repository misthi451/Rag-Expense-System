export const metadata = {
  title: 'RAG Expense System',
  description: 'AI-powered expense tracker using RAG with Gemini and Supabase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
