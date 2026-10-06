export const metadata = {
  title: "Lead Tracker",
  description: "Every lead, one board.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
