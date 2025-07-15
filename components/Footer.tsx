/**
 * Footer Component - Clean footer without Related Stories or Journal sections
 * Includes About VERTEX Athletic section instead
 */

import React from 'react';

interface FooterProps {
  className?: string;
  showAbout?: boolean;
  contactEmail?: string;
  companyName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  className = '',
  showAbout = true,
  contactEmail = 'hello@vertex-athletic.com',
  companyName = 'VERTEX Athletic'
}) => {
  return (
    <footer className={`bg-gray-900 text-white ${className}`}>
      {showAbout && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">About VERTEX Athletic</h2>
              <p className="text-xl text-purple-100 max-w-4xl mx-auto mb-8">
                Founded in 2018 by mountaineers, trail runners, and environmental scientists, 
                VERTEX Athletic creates athletic footwear that performs at the highest level 
                while respecting the environments we love to explore.
              </p>
              
              <div className="grid md:grid-cols-4 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">500,000+</div>
                  <div className="text-purple-200">Happy feet on trails</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">2.5M</div>
                  <div className="text-purple-200">Bottles recycled</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">47</div>
                  <div className="text-purple-200">Pro athletes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">$1M+</div>
                  <div className="text-purple-200">Trail conservation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{companyName}</h3>
              <p className="text-gray-400 mb-4">
                "Reach Your Peak" isn't just our tagline—it's our promise. 
                We create gear that helps everyone reach their own summit.
              </p>
              <div className="text-purple-400 font-bold text-lg">#ReachYourPeak</div>
            </div>

            {/* Our Values */}
            <div>
              <h3 className="text-lg font-semibold mb-4">What We Stand For</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <span className="mr-2">🏔️</span>
                  Performance Without Compromise
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🌍</span>
                  Sustainability First
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🤝</span>
                  Community Over Competition
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🔬</span>
                  Innovation With Purpose
                </li>
              </ul>
            </div>

            {/* Technology */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Our Technology</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <span className="font-semibold text-white">Storm Shield™</span>
                  <br />All-weather protection that breathes
                </li>
                <li>
                  <span className="font-semibold text-white">CloudCore™</span>
                  <br />Energy-return cushioning
                </li>
                <li>
                  <span className="font-semibold text-white">GripTech™</span>
                  <br />Outsoles that stick to any surface
                </li>
                <li>
                  <span className="font-semibold text-white">EcoWeave™</span>
                  <br />Fabric made from ocean plastic
                </li>
              </ul>
            </div>

            {/* Get Involved */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Join Our Journey</h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center">
                    <span className="mr-2">🏃</span>
                    Join a local run club
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center">
                    <span className="mr-2">🌱</span>
                    Volunteer for trail maintenance
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center">
                    <span className="mr-2">📱</span>
                    Download our app
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center">
                    <span className="mr-2">📧</span>
                    Subscribe to newsletter
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Founders Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <h3 className="text-lg font-semibold mb-6 text-center">Meet Our Founders</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-semibold text-white">Marcus Chen</h4>
                <p className="text-purple-400 text-sm">CEO & Co-founder</p>
                <p className="text-gray-400 text-sm mt-2">
                  Former Nike designer and ultrarunner with 15+ years in footwear innovation
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-white">Dr. Elena Rodriguez</h4>
                <p className="text-purple-400 text-sm">Chief Sustainability Officer</p>
                <p className="text-gray-400 text-sm mt-2">
                  Environmental scientist and mountaineer protecting outdoor environments
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-white">James "Trail" Thompson</h4>
                <p className="text-purple-400 text-sm">Head of Product</p>
                <p className="text-gray-400 text-sm mt-2">
                  Professional trail runner who's tested equipment on all seven continents
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              <p className="mb-2 md:mb-0">
                © 2024 {companyName}. All rights reserved. | 
                <span className="ml-1">Certified B Corporation & 1% for the Planet member</span>
              </p>
              <p>Portland, OR headquarters runs on 100% renewable energy</p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-400 text-sm">
                Questions? <a href={`mailto:${contactEmail}`} className="text-purple-400 hover:text-white transition-colors">{contactEmail}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;