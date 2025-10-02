export default function Home() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">KF Insurance Booking System</h1>
        <p className="text-lg mb-6">Select a booking calendar:</p>

        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="/nexttest"
            className="p-6 border rounded-lg bg-white hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Next Test</h2>
            <p className="text-gray-600">Book appointments with Next Test team</p>
          </a>

          <a
            href="/insuranceswag"
            className="p-6 border rounded-lg bg-white hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Insurance Swag</h2>
            <p className="text-gray-600">Book appointments with Insurance Swag team</p>
          </a>
        </div>
      </main>
    </div>
  );
}
