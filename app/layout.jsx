import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ToastContext';

export const metadata = {
  title: 'Soft Tech Solution | Your Growth, Our Mission.',
  description: 'Digital growth partner for ambitious brands. Social media marketing, custom websites, SEO, Google & Meta Ads, branding, and web development.',
  keywords: 'Soft Tech Solution, digital agency, web development, SEO, social media marketing, Ankitosh Kumar, Ashutosh Kumar',
  openGraph: {
    title: 'Soft Tech Solution | Strategic Digital Growth',
    description: 'We turn digital complexity into clear, measurable opportunities for your business.',
    url: 'https://softtechsolution.com',
    siteName: 'Soft Tech Solution',
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/soft-tech-solution-logo.jpeg" />
      </head>
      <body>
        <ToastProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
