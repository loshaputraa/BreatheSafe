const mod = require('./dist/route-health-scoring-fixed')
console.log('MOD_KEYS', Object.keys(mod))

const sampleInput = {
  encodedPolyline: '}_p~F~ps|U_ulLnnqC_mqNvxq`@',
  routeMetadata: { avgAqi: 55, distanceKm: 4.2, durationMinutes: 15, trafficLevel: 'moderate' },
  healthProfile: { age: 30, sensitivity: 'normal' },
  travelMode: 'WALKING'
}

(async () => {
  try {
    const result = await mod.calculateRouteHealthScore(sampleInput)
    console.log('TEST_OK')
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('TEST_ERROR')
    console.error(err)
    process.exit(1)
  }
})()
