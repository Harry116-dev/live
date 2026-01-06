{
  "version": 2,
  "builds": [
    {
      "src": "angular.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/live"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
