# Marketing Content Management Platform(Demo)

![Image](https://github.com/user-attachments/assets/4ab25b6b-3911-464c-b547-71a5cbca371d)

## Overview

This platform helps me and my illustration team manage marketing content and product descriptions more efficiently, especially with the 8-hour time difference between the UK and Taiwan.

We often struggled with keeping track of edits and feedback across different time zones. This tool allows us to create and edit content asynchronously, manage multiple versions, and use a compare mode to clearly see changes. Once finalized, we can easily apply the best version to social media posts, product listings, and email campaigns.

## ✅ Features

### Document Versioning

Implemented full versioning support: users can create, edit, save, delete versions, and switch freely between the main content and its versions.

### AI Suggestions via WebSocket

Utilize WebSocket integration. Plain text (HTML tags removed) is sent to the backend, allowing the AI API to process it and stream real-time suggestions back to the frontend.

### Compare Mode (Custom Feature)

Users can click "Compare" to enter compare mode, select a version, and view a side-by-side comparison. Edits can be made directly within this mode.  
I used `localStorage` to simplify development and focus on validating versioning logic and user experience, without adding backend complexity at this stage.

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

- ✅ backend integration tests: version creation, deletion, and retrieval
- ✅ frontend unit test: ensuring AI suggestions render correctly

To run tests (adjust based on test runner used):

### 🔹 Run backend tests (recommended – with pytest)

Make sure you're inside the `server` folder and run:

```bash
PYTHONPATH=. pytest tests/test_versions.py
```

This gives clear output and ensures all test\_ functions are executed.

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
- Content unnecessary AI calls by checking content relevance before sending to the backend.

---

## Author

**Amy Hanhsun Shih**
