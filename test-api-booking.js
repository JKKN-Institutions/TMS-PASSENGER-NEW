// Test script to verify booking visibility API
const studentId = '0a800954-f854-4115-a652-20254478781a';
const routeId = 'f854a895-cb60-4c95-8e28-47d6c038e573';
const startDate = '2025-11-03';
const endDate = '2025-12-03';

console.log('Testing schedules availability API...');
console.log('Parameters:', { studentId, routeId, startDate, endDate });

const url = `http://localhost:3000/api/schedules/availability?routeId=${routeId}&startDate=${startDate}&endDate=${endDate}&studentId=${studentId}`;
console.log('\nAPI URL:', url);
console.log('\nPlease start the dev server (npm run dev) and then run:');
console.log(`curl "${url}" | node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(0)); console.log('Schedules with bookings:', data.filter(s=>s.user_booking).length); console.log('Total schedules:', data.length); data.filter(s=>s.user_booking).forEach(s=>console.log('Booking found for:', s.schedule_date, s.user_booking))"`);
