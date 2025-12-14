import Image from 'next/image';
import { FaTwitter, FaGithub, FaDiscord } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="w-full text-gray-400 mx-auto px-8 md:px-20 lg:px-40 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-gray-800 pt-12 x">
          <div className="md:col-span-1">
            <Image src="/image/phdv-logo.svg" alt="PHDV-AI Logo" width={80} height={24} />
            <p className="text-sm mt-4">Decentralized personal health data vault, powered by AI and blockchain technology.</p>
            <div className="flex gap-4 mt-4 text-2xl">
              <a href="#" className="hover:text-white"><FaTwitter /></a>
              <a href="#" className="hover:text-white"><FaGithub /></a>
              <a href="#" className="hover:text-white"><FaDiscord /></a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Dashboard</a></li>
              <li><a href="#" className="hover:text-white">Researcher Portal</a></li>
              <li><a href="#" className="hover:text-white">DAO & Governance</a></li>
              <li><a href="#" className="hover:text-white">Tokenomics</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Documentation</a></li>
              <li><a href="#" className="hover:text-white">API Reference</a></li>
              <li><a href="#" className="hover:text-white">Whitepaper</a></li>
              <li><a href="#" className="hover:text-white">Community</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Compliance</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-6 flex justify-between items-center text-sm">
          <p>&copy; 2025 PHDV-AI. All rights reserved.</p>
          <p></p>
        </div>
      </div>
    </footer>
  );
}