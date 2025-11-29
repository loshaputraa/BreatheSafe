import { calculateRouteHealthScore } from '../src/ai/flows/route-health-scoring-fixed'

async function run() {
  const sampleInput: any = {
    avgAqi: 55,
    routeDistanceKm: 4.2,
    routeDurationMinutes: 15,
    trafficLevel: 'moderate',
    healthProfile: { age: 30, sensitivity: 'normal' },
    travelMode: 'WALKING',
    // short sample polyline (encoded) — may be ignored by fallback logic
    polyline: '}_p~F~ps|U_ulLnnqC_mqNvxq`@'
  }

  try {
    const result = await calculateRouteHealthScore(sampleInput)
    console.log('TEST_OK')
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('TEST_ERROR')
    console.error(err)
    process.exit(1)
  }
}

run()
