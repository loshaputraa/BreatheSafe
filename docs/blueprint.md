# **App Name**: BreatheSafe Navigator

## Core Features:

- Pollution-Aware Routing: Calculate routes based on real-time air quality data from OpenAQ and traffic information from OpenRouteService (free tier).
- Real-time AQI Updates: Display current Air Quality Index (AQI) from OpenAQ for Malaysia on the map, updated in real-time (free tier).
- Route Health Score: Assign a health score (0-100) to each route option, calculated based on pollution levels and route distance using free tier services. The tool uses a reasoning engine to evaluate route distance relative to pollution to recommend an optimized path.
- Map Interface: Provide a simple map interface using Leaflet and OpenStreetMap for users to input start and end points via clicks or search (free).
- Route Options: Display 2-3 route options ranked by the health score, highlighting the safest route visually on the map.

## Style Guidelines:

- Primary color: A calming blue (#5DADE2) to represent clean air and trustworthiness.
- Background color: Very light blue (#E0F7FA) to create a clean and airy feel.
- Accent color: A gentle green (#A3E4D7) to highlight the safest routes and represent health.
- Body and headline font: 'PT Sans', a modern sans-serif, for clear and accessible readability on maps and data displays.
- Use clean and simple icons to represent air quality, traffic levels, and route health scores.
- A clean, card-based design to clearly display routes with key metrics.