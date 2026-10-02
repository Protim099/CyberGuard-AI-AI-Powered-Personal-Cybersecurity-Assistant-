import './globals.css';
import {Manrope} from 'next/font/google';
const f=Manrope({subsets:['latin'],variable:'--font-manrope'});
export const metadata={title:'CyberGuard AI',description:'AI-Powered Personal Cybersecurity Assistant'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={f.variable}><body>{children}</body></html>}
