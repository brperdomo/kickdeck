import { useSearchParams } from 'wouter';
import GameScoreManager from '@/components/admin/scoring/GameScoreManager';

export default function GameScoreManagement() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Event Required</h1>
          <p>Please select an event to manage game scores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <GameScoreManager eventId={eventId} />
      </div>
    </div>
  );
}