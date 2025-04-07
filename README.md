# Solve Intelligence Coding Challenge – Amy

## Overview

This is my submission for the Solve Intelligence coding challenge. It includes the required tasks and one custom feature.

## ✅ Task Summary

### Task 1 – Document Versioning  
Implemented full versioning support: users can create, edit, save, delete versions, and switch freely between the main patent and its versions.

### Task 2 – AI Suggestions via WebSocket  
Completed the WebSocket integration. Plain text (HTML tags removed) is sent to the backend, allowing the AI API to process it and stream real-time suggestions back to the frontend.

### Task 3 – Compare Mode (Custom Feature)  
Users can click "Compare" to enter compare mode, select a version, and view a side-by-side comparison. Edits can be made directly within this mode.  
I used `localStorage` to simplify development and focus on validating versioning logic and user experience, without adding backend complexity at this stage.

**Why I built this:**  
A friend working in the field mentioned that they often need to compare different document versions and usually rely on Word’s comparison feature. While working on Task 1, I also found myself switching back and forth frequently, which was time-consuming. Based on both my own experience and my friend’s feedback, I believe this feature could bring real value to users.

---

## 💻 How to Run the Project (via Docker)

1. Clone the project  
2. Create a `.env` file using `.env.example` and add your OpenAI API key  
3. In the project root, run:

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## 🧪 Testing

- ✅ 3 backend tests for Task 1: version creation, deletion, and retrieval  
- ✅ 1 frontend test for Task 2: ensuring AI suggestions render correctly

To run tests (adjust based on test runner used):

### 🔹 Run backend tests (recommended – with pytest)

Make sure you're inside the `server` folder and run:

```bash
PYTHONPATH=. pytest tests/test_versions.py
```
This gives clear output and ensures all test_ functions are executed.

🔸 Or run backend tests inside the Docker container:
```bash
Copy code
docker exec -it <backend_container_name> bash
# Then inside the container:
PYTHONPATH=. python tests/test_versions.py
```
Note: The Docker version uses plain assert statements. If all tests pass, there will be no output.

### 🔹 Run frontend tests:
```
cd client
npm run test
```

---

## 🌱 Future Improvements

- Add a **keyword tagging feature** that highlights user-defined terms across the document.  
  A friend who writes patent specifications mentioned this would save time during document review.
- Prevent unnecessary AI calls by checking content relevance before sending to the backend.

---

## Author

**Amy Hanhsun Shih**  
https://github.com/HanHsunShih

Feel free to reach out if there are any questions. Thank you for the opportunity!
