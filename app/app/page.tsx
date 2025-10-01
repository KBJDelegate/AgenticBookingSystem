export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">KF Insurance Booking System</h1>
        <p className="text-lg mb-4">Welcome to the new booking system.</p>
        <a href="/booking" className="text-blue-600 hover:underline">
          Go to Booking
        </a>
      </main>
    </div>
  );
}
