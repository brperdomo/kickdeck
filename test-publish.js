// Simple test script to simulate publishing schedules
const testData = {
  games: [
    {
      id: 1,
      homeTeam: 'Team Alpha',
      awayTeam: 'Team Beta',
      ageGroup: 'U13 Boys',
      flightName: 'Nike Elite',
      field: 'Field 1',
      date: '2025-08-16',
      time: '08:00',
      duration: 90,
      status: 'scheduled'
    },
    {
      id: 2,
      homeTeam: 'Team Gamma',
      awayTeam: 'Team Delta',
      ageGroup: 'U13 Boys',
      flightName: 'Nike Elite', 
      field: 'Field 2',
      date: '2025-08-16',
      time: '10:00',
      duration: 90,
      status: 'scheduled'
    }
  ],
  ageGroups: [
    {
      ageGroup: 'U13 Boys',
      flights: [
        {
          flightName: 'Nike Elite',
          teamCount: 8,
          gameCount: 13
        }
      ]
    }
  ],
  eventInfo: {
    name: 'Summer Tournament',
    startDate: '2025-08-16',
    endDate: '2025-08-17'
  },
  standings: [
    {
      teamName: 'Team Alpha',
      ageGroup: 'U13 Boys',
      flightName: 'Nike Elite',
      gamesPlayed: 2,
      wins: 2,
      losses: 0,
      ties: 0,
      goalsFor: 5,
      goalsAgainst: 1,
      points: 6
    }
  ]
};

console.log('Sample published data structure:');
console.log(JSON.stringify(testData, null, 2));