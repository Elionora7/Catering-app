# 🔍 How to Get the Actual Error Details

## Option 1: Check Network Tab Response (Easiest)

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Find the failed `/api/meals` request (it will be red)
4. Click on it
5. Go to the **Response** tab
6. You should see the error message like:
   ```json
   {
     "error": "Failed to fetch meals",
     "details": "[actual error message]",
     "code": "[error code]"
   }
   ```
7. **Copy and paste that response here**

## Option 2: Check Server Terminal

1. Look at the terminal where `npm run dev` is running
2. Scroll up to find error messages
3. Look for lines starting with:
   - `❌ [MEALS API]`
   - `Error fetching meals:`
   - `PrismaClient`
   - Any red error text
4. **Copy and paste those error messages here**

## Option 3: Test Directly

Visit this URL in your browser:
```
http://localhost:3000/api/meals
```

You should see the error response directly in JSON format. Copy and paste that here.

---

**Please use Option 1 (Network Tab Response) - it's the easiest way to see the actual error!**
