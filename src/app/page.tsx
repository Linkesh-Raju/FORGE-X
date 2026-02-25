import ReportForm from '@/components/ReportForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-600">CityFix</h1>
          <p className="text-slate-600">Smart Citizen Reporting Portal</p>
        </header>
        
        {/* We will create this component next */}
        <ReportForm />
      </div>
    </main>
  );
}