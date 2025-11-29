const { calculateRouteHealthScore } = require('./route-health-scoring-fixed')

(async () => {
  const sampleInput = {
    encodedPolyline: '}_p~F~ps|U_ulLnnqC_mqNvxq`@',
    routeMetadata: { avgAqi: 55, distanceKm: 4.2, durationMinutes: 15, trafficLevel: 'moderate' },
    healthProfile: { age: 30, sensitivity: 'normal' },
    travelMode: 'WALKING'
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
})()
