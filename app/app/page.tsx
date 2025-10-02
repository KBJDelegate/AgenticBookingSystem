'use client';

import { useState, useEffect } from 'react';

interface Brand {
  id: string;
  name: string;
  description?: string;
}

export default function Home() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/calendar/brands');
      const data = await res.json();
      setBrands(data.brands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">KF Insurance Booking System</h1>
        <p className="text-lg mb-6">Select a booking calendar:</p>

        {loading ? (
          <p>Loading calendars...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {brands.map((brand) => (
              <a
                key={brand.id}
                href={`/${brand.id}`}
                className="p-6 border rounded-lg bg-white hover:shadow-lg transition-shadow"
              >
                <h2 className="text-2xl font-semibold mb-2">{brand.name}</h2>
                <p className="text-gray-600">
                  {brand.description || `Book appointments with ${brand.name} team`}
                </p>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
