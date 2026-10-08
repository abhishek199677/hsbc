import Link from 'next/link';

export default function ExpertsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Our Experts</h1>
      <p className="text-xl mb-8">Connect directly with industry professionals from MAANG+ for personalized interview prep.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mock Expert Cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
              <div>
                <h3 className="font-bold text-lg">Expert {i}</h3>
                <p className="text-sm text-gray-500">Software Engineer @ Google</p>
              </div>
            </div>
            <p className="text-sm mb-4">5+ years of experience conducting technical interviews. Specialized in System Design and DSA.</p>
            <div className="flex justify-between items-center">
              <span className="font-bold">$50/hr</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Book Session</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
