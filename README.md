# BookLeaf Author Support & Communication Portal
## Project Approach, Priorities, Trade-offs & Production Evolution

### 1. Project Priorities

The primary objective was to build a centralized support and communication platform that enables BookLeaf authors to manage their books, track royalty information, and raise support requests while allowing administrators to efficiently manage and resolve those requests.

Development prioritized the following areas:

- **Author experience:** Secure authentication, author-specific book and royalty information, support ticket creation, and conversation history.
- **Administrative efficiency:** A centralized dashboard with ticket filtering, status management, category and priority overrides, self-assignment, internal notes, and author communication.
- **AI-assisted support:** Automated ticket classification, priority assessment, and response drafting using Google's Gemini API, with administrators retaining control over the final response.
- **Data security and reliability:** Role-based access control, author-level data isolation, input validation, and persistent storage.

### 2. Technical Decisions and Trade-offs

The application uses React with TypeScript for the frontend and FastAPI with SQLAlchemy for the backend. This combination provides a responsive user interface, structured API development, and straightforward integration with AI services.

A relational database was selected to maintain consistency across authors, books, tickets, messages, and internal notes. REST APIs provide a clear separation between frontend and backend responsibilities, while FastAPI's Swagger/OpenAPI documentation simplifies API testing and integration.

Gemini was integrated to classify support requests, assess priority, and generate suggested responses. AI outputs are treated as recommendations rather than automatic decisions. Administrators can manually override classifications and priorities and review responses before sending them.

A key trade-off was prioritizing a functional, explainable AI-assisted workflow over fully autonomous ticket resolution. This preserves human oversight, reduces the risk of inappropriate responses, and keeps administrators accountable for customer-facing communication.

The implementation also favors a modular architecture and incremental feature development, making individual components easier to test and extend.

### 3. Challenges and Solutions

Integrating AI into the ticket creation workflow required handling model availability, API compatibility, and structured response formatting. These issues were addressed by configuring a compatible Gemini API endpoint, validating structured AI outputs, and implementing fallback behavior when classification is unsuccessful.

Another important consideration was access control. Authors must only be able to access their own books and support tickets, whereas administrators require cross-author visibility. This was addressed through backend authorization checks rather than relying solely on frontend restrictions.

The administrative workflow was also designed to preserve human control through editable AI suggestions, manual overrides, ticket assignment, and private internal notes.

### 4. Production Evolution

To evolve the application into a production-grade platform, the next priorities would be:

- **Scalability:** Introduce Redis caching, background job processing, and asynchronous AI requests to handle higher ticket volumes.
- **Real-time communication:** Implement WebSockets or Server-Sent Events for immediate ticket and conversation updates.
- **Reliability:** Add comprehensive automated tests, structured logging, monitoring, centralized error tracking, and database backup strategies.
- **Security:** Introduce stronger session management, rate limiting, audit logs, secure attachment storage, and stricter input validation.
- **AI governance:** Track classification accuracy, monitor token usage and costs, evaluate response quality, and maintain human approval for customer-facing replies.
- **Deployment:** Containerize the application, configure CI/CD pipelines, use managed database infrastructure, and deploy behind HTTPS with environment-based configuration.

### 5. Conclusion

The BookLeaf Author Support & Communication Portal demonstrates how a full-stack application can combine structured support workflows with practical AI assistance. The implementation focuses on usability, access control, administrative efficiency, and human-supervised automation. Its modular architecture provides a foundation for evolving the assignment prototype into a scalable, secure, and maintainable production support platform.

### 6. Admin and Author Password

Kindly login on live portal (https://bookleaf-frontend-9qfl.onrender.com/)  with these credentials : 
Admin Email : admin@bookleaf.com, 
Admin Password : riuwggwjkgngnvojondvnk, 
Author Email : Given in backend/seed/authors_books.json, 
Author Password : eioahfafnadofmkadnvn
