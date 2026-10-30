# ICP Clarity Lab — Project Context

## 1. Document Purpose

This document defines the product concept, intended users, modules, expected behaviour, implementation boundaries, AI reliability requirements and competition context for ICP Clarity Lab.

It is intended to be read by AI coding agents before they create or modify the application.

The document distinguishes between:
- Confirmed requirements.
- Proposed implementation decisions.
- Unverified assumptions.
- Future improvements that are outside the initial scope.

Do not treat every proposed technical detail as a proven requirement. Where a decision remains open, choose a simple, reversible implementation and document the choice.

**Project name:** ICP Clarity Lab  
**Name status:** Working title; availability has not been checked.  
**Project category:** AI-assisted B2B customer-profile development.  
**Intended distribution:** Open source.  
**Initial audience:** B2B founders and people responsible for acquiring business customers.  
**Primary market:** India initially, with potential applicability to other markets.  
**Development approach:** AI coding agents, with Wispr Flow used to dictate requirements and development instructions.  
**Current status:** Proposed project; implementation, usability and market demand are not yet established.

---

# 2. Founder Context

The project is being developed by a solo founder building KRIU, a separate, proprietary hiring-related product.

The founder has encountered difficulties identifying ideal customers, researching target companies and approaching potential buyers.

The founder wants to create an open-source project that is useful beyond their own business. The project should demonstrate practical product thinking, an understanding of a real problem, effective use of generative AI and the ability to build a usable application.

The founder has limited development time and wants to avoid unnecessary infrastructure, expensive services and a large maintenance burden.

The project should therefore be small enough to build and demonstrate in a short development cycle.

Do not turn this project into a large lead-generation platform merely because it could eventually support additional features.

---

# 3. Product Vision

## 3.1 What is ICP Clarity Lab?

ICP Clarity Lab helps a founder convert an incomplete, lengthy or unstructured description of their business into a clear, editable and testable Ideal Customer Profile (ICP).

The application uses generative AI to organise the user's thinking, identify missing information, separate assumptions from user-provided facts, suggest relevant buyer roles and produce a customer-validation plan.

Its purpose is to help the founder understand whom they should target and what they need to validate before investing heavily in customer acquisition.

## 3.2 The problem

A founder might know what they sell but struggle to describe precisely which businesses are most suitable customers.

They may write a vague statement such as:

"I provide AI automation services to growing companies."

This statement leaves several unanswered questions:

- What type of companies?
- In which locations?
- What business problem does the service address?
- What makes a company suitable?
- Which person is involved in purchasing?
- What evidence suggests a company may need the service?
- Which assumptions still require validation?

A generic AI response can produce a polished ICP while quietly inventing details about company size, budget, business requirements or buying behaviour.

ICP Clarity Lab should make these gaps visible.

## 3.3 Product objective

Given a founder's business description, the application should produce:

1. A structured ICP.
2. An explanation of its major criteria.
3. A distinction between user-provided information and AI-generated interpretations.
4. A list of assumptions and unresolved questions.
5. A suggested buyer persona or relevant decision-maker roles.
6. A practical customer-validation plan.
7. An editable result that can be copied or exported.

The output should be useful without requiring the application to search the internet or maintain a business database.

## 3.4 Product promise

The application helps users clarify and test their assumptions about ideal customers.

It does not prove that an ICP is correct merely because an LLM generated it.

An ICP becomes better supported when its assumptions have been examined using customer conversations, observed behaviour, sales outcomes or reliable external evidence.

---

# 4. Important Distinctions

## 4.1 ICP Clarity Lab is not a lead database

The initial application does not need to discover hundreds of companies or collect business contact information.

It helps determine the type of company a user should target.

Finding real businesses that match the profile is a possible future extension, not an initial requirement.

## 4.2 ICP Clarity Lab is not an ICP-validation oracle

The LLM cannot establish market demand from a founder's description alone.

It can organise a hypothesis, identify missing information and propose ways to test it.

Actual validation requires evidence beyond the generated document.

## 4.3 ICP Clarity Lab is not industry-specific

The application should support different B2B businesses through configurable criteria rather than industry-specific hardcoding.

Possible examples include:

- Solar installation companies.
- Software and SaaS businesses.
- IT service providers.
- Recruitment agencies.
- Website development agencies.
- Marketing consultants.
- Manufacturing suppliers.
- Business automation consultants.
- Other B2B products and services.

These are illustrative use cases, not evidence that the product has been tested successfully across these industries.

## 4.4 ICP and buyer persona are different

An ICP describes the type of company that is a suitable target.

A buyer persona describes the type of person or organisational role that may evaluate or purchase the offering.

For example:

- ICP: Manufacturing businesses in Telangana with facilities potentially suitable for commercial solar installations.
- Possible buyer roles: Business owner, facilities manager or finance decision-maker.

The appropriate buyer role depends on the actual purchase process. It must not be presented as a verified individual identity.

---

# 5. Target Users

## 5.1 Primary persona: Solo B2B founder

**Situation**

An individual operates a B2B business without a dedicated sales or marketing team.

**Challenges**

- The target market is too broad.
- The founder is uncertain about which businesses to prioritise.
- Available customer information is incomplete.
- There is limited time for market research.
- The founder needs a practical starting point for customer discovery.

**Desired result**

A clear, editable target-company profile and an actionable plan for testing its assumptions.

## 5.2 Secondary persona: Small agency owner

The owner sells services such as software development, digital marketing, recruiting, design or consulting.

They want to understand which companies are most likely to benefit from their service.

## 5.3 Secondary persona: Independent consultant

The consultant wants to narrow their market, communicate their positioning and determine which customer characteristics matter most.

## 5.4 Secondary persona: Early-stage startup team

A small startup needs a shared understanding of the companies it intends to serve before spending significantly on sales and marketing.

## 5.5 User expectations

The user should not need specialist knowledge of sales terminology to use the product.

The interface should explain concepts such as ICP, buyer persona, mandatory criteria and assumptions in accessible language.

The application must allow the user to correct the AI rather than forcing them to accept its interpretation.

---

# 6. Competition Context: Wispr Flow Hiring Challenge

## 6.1 Relevant challenge

The current competition context is the **Wispr Flow Hiring Challenge**, whose official brief describes an opportunity to demonstrate creativity, ownership, use of voice and practical work as part of an India growth-team recruitment process.

Official challenge page:

https://wispr-seven-day-challenge.wispr-flow-5934.chatgpt.site/

The published submission deadline is November 4, 2026.

The challenge requests:

1. A publicly accessible portfolio built on Emergent using Wispr Flow.
2. A video explaining what was built, why it was built and what value voice provided.
3. A choice describing how the $3,000 work-setup grant would be used.
4. A public post on LinkedIn or X tagging Wispr Flow and Emergent.

The challenge's stated evaluation themes include creativity, meaningful use of voice, ownership, evidence of work and relevant logistical readiness.

The official brief describes a pathway to a full-time role for interns, but participation does not guarantee an internship or employment.

All requirements, dates and submission details must be rechecked on the official page before submission.

## 6.2 How ICP Clarity Lab relates to this challenge

ICP Clarity Lab should be presented as a featured project demonstrating the founder's ability to:

- Identify a real problem.
- Define a focused solution.
- Convert a vague requirement into a working product.
- Use generative AI thoughtfully.
- Make product decisions independently.
- Distinguish evidence from assumptions.
- Explain the reasoning behind design choices.
- Communicate the work clearly through voice.

**Important:** A standalone ICP generator does not, by itself, satisfy the official brief's request for a new personal portfolio.

The intended submission should be a personal portfolio that presents the founder, their thinking and work, with ICP Clarity Lab as a central interactive project or case study.

The portfolio must be newly created for the challenge rather than an existing portfolio submitted unchanged.

## 6.3 Separate challenge warning

The No Hands: The Wispr Challenge is a separate event with different rules and deadlines.

Official page:

https://www.wemakedevs.org/wispr

Do not merge the two challenges' submission checklists or assume their judging criteria are interchangeable.

---

# 7. Wispr Flow Usage

## 7.1 Role of Wispr Flow

Wispr Flow is intended to help the founder dictate project requirements, coding instructions, corrections, documentation and development notes.

The founder should be able to explain requirements naturally rather than manually typing every instruction.

The development workflow should include:

1. Dictating the product requirements.
2. Asking the AI coding agent to implement a specific module.
3. Reviewing the implementation.
4. Dictating corrections based on actual behaviour.
5. Testing the application.
6. Dictating documentation and project explanations.
7. Recording the development decisions for the portfolio.

## 7.2 Runtime requirement

Wispr Flow is a development and dictation tool for this project.

The deployed ICP Clarity Lab application does not need to integrate Wispr Flow directly or require users to install it.

Do not add voice recognition, microphone permissions or speech-processing infrastructure to the application unless separately approved as a deliberate feature.

The project should demonstrate how voice assisted its creation, not artificially depend on voice technology at runtime.

---

# 8. Product Modules

The initial application should contain the following small set of modules.

## Module 1: Business Brief Input

### Purpose

Capture the founder's description of the business and intended customers.

### Input

A long-form text field where the user describes:

- What they sell.
- Which companies they think need it.
- The business problem addressed.
- Target geography, if known.
- Preferred customer characteristics.
- Known exclusions.
- Any existing customer observations.

Optional structured fields may be provided, but users must be able to proceed with a plain-English description alone.

### Behaviour

The user submits their description and starts the ICP-generation process.

The application should warn users not to include confidential customer data unnecessarily.

### Acceptance criteria

- A short description can be processed.
- A longer description can be processed within the chosen model's context limits.
- Empty input is rejected with a clear message.
- User input is preserved when an API call fails.
- The system does not require every optional field.

## Module 2: ICP Compiler

### Purpose

Transform the business brief into structured ICP information.

### Responsibilities

The LLM extracts:

- Offering.
- Target company type.
- Geography.
- Business characteristics.
- Potential customer problems.
- Mandatory criteria.
- Preferred criteria.
- Exclusions.
- Buying signals, where described.
- Missing information.

The compiler must preserve the user's explicit constraints.

### Example

User description:

"I provide commercial solar installations to manufacturing companies in Telangana. I am interested in companies with suitable facilities and high electricity consumption. I prefer businesses that are expanding. I don't want residential customers."

The system might generate:

- Offering: Commercial solar installation.
- Target entity: Manufacturing company.
- Geography: Telangana.
- Preferred criteria: Suitable facilities and high electricity consumption.
- Potential signal: Expansion activity.
- Exclusion: Residential customers.
- Unknown: The precise definition of a suitable facility.
- Unknown: What evidence establishes high electricity consumption.

These are interpreted criteria, not independently verified market facts.

### Acceptance criteria

- The output follows a defined schema.
- Explicit exclusions are preserved.
- Missing details remain unknown.
- The user can inspect the generated result.
- The user can edit every important field.
- The original business brief is preserved.

## Module 3: Assumption Ledger

### Purpose

Prevent AI-generated assumptions from being mistaken for facts.

Each material statement should be assigned a clear origin or status.

Suggested categories:

**User-provided:** Explicitly stated by the founder.

**AI interpretation:** A structured interpretation of what the founder said.

**Assumption:** A plausible hypothesis that has not been confirmed.

**Unknown:** Information that is missing or cannot currently be established.

**User-confirmed:** A generated interpretation or assumption that the user has explicitly reviewed and accepted.

User confirmation means the user accepted the statement. It does not independently prove the statement is true.

### Example

Claim: "The target customer is a manufacturing business in Telangana."

Origin: User-provided.

Claim: "The company must employ at least 500 people."

Origin: Unknown unless the user stated or explicitly approved this threshold.

Claim: "A business expansion might increase demand for commercial solar."

Origin: Assumption or hypothesis.

The application must not silently turn the final claim into a verified buying signal.

### Acceptance criteria

- Important claims show their origin.
- Unknowns are visible.
- The user can edit or reject assumptions.
- Assumptions do not automatically become factual statements.
- The final exported ICP retains the relevant uncertainty information.

## Module 4: Buyer Persona Suggestions

### Purpose

Suggest potentially relevant buyer roles for the ICP.

Examples include a founder, CEO, CTO, facilities manager, procurement manager or business-unit leader.

### Behaviour

The LLM should explain why a role may be relevant to the purchasing decision.

It should distinguish between roles that influence a purchase, roles that use the offering and roles that authorise spending when the available information supports those distinctions.

Do not fabricate individual names, job titles or contact details.

### Acceptance criteria

- The application suggests roles rather than fabricating real people.
- The user can edit or remove suggested roles.
- Uncertain purchasing authority is explicitly qualified.

## Module 5: Customer-Validation Questions

### Purpose

Help the founder test the assumptions in the generated ICP.

The system should produce practical questions for conversations with people who match the proposed target profile.

### Example

For a proposed commercial solar ICP, potential questions could include:

- How do you currently evaluate electricity costs and energy investments?
- Who is involved in evaluating a solar installation?
- What factors determine whether a facility is suitable?
- What would cause you to investigate solar in the next year?
- What information would you require before evaluating a provider?

These questions are examples. They are not evidence that a particular company has these needs.

### Requirements

Questions should be connected to assumptions or unknowns in the ICP.

The application should avoid leading questions that pressure the interviewee to agree with the founder.

Prioritise questions about the person's current behaviour, constraints, decision process and past experience over questions asking whether an idea sounds good.

### Acceptance criteria

- Each major unresolved assumption has a relevant question where practical.
- The user can edit and copy questions.
- The app does not claim that generated questions validate the ICP automatically.

## Module 6: Validation Plan

### Purpose

Convert the questions and assumptions into a practical next-step plan.

A validation plan may include:

- Which type of person to speak with.
- Which uncertainty to investigate.
- Which question to ask.
- What evidence would support or weaken the hypothesis.
- How to record the response.
- What decision to make after reviewing the evidence.

Do not impose universal interview counts, thresholds or statistical claims without an explicit methodology.

The application can suggest a small exploratory experiment but must label it as a starting plan rather than a statistically proven sample size.

## Module 7: Editable ICP Report

### Purpose

Display the generated result in a clear, usable format.

Suggested sections:

1. Business summary.
2. ICP statement.
3. Target-company criteria.
4. Mandatory requirements.
5. Preferred characteristics.
6. Exclusions.
7. Potential buying signals.
8. Buyer persona suggestions.
9. Assumptions and unknowns.
10. Questions requiring validation.
11. Proposed next steps.

The user must be able to edit the result before exporting it.

Do not hide uncertainty in footnotes or behind generic confidence badges.

## Module 8: Export

### Purpose

Allow the founder to use the result outside the application.

Support Markdown and JSON export.

The Markdown report should be readable without special tools.

The JSON export should preserve the structured fields and status information.

Neither export should contain fabricated source citations or pretend that market research occurred when the application only processed the user's description.

---

# 9. Suggested ICP Data Structure

The following schema is illustrative. It should be validated and adjusted during implementation.

```json
{
  "business_brief": "",
  "offering": "",
  "target_entity": "",
  "geography": {
    "include": [],
    "exclude": []
  },
  "mandatory_criteria": [],
  "preferred_criteria": [],
  "exclusions": [],
  "potential_buying_signals": [],
  "buyer_roles": [],
  "assumptions": [],
  "unknowns": [],
  "validation_questions": [],
  "validation_plan": [],
  "metadata": {
    "schema_version": "1.0",
    "created_at": null
  }
}
```

Each criterion or claim should eventually carry a status describing its origin.

For example:

```json
{
  "criterion": "Target manufacturing businesses",
  "status": "user_provided",
  "explanation": "Explicitly included in the original business description",
  "user_confirmed": true
}
```

The exact schema may change during development.

Do not add arbitrary numerical fields or confidence scores without a clear definition and an implementation need.

---

# 10. LLM Design and Hallucination Controls

## 10.1 LLM responsibilities

The LLM is responsible for understanding the user's description and proposing a structured representation.

It can:

- Extract criteria.
- Rephrase unclear statements.
- Identify missing information.
- Suggest possible buyer roles.
- Generate validation questions.
- Draft a readable summary.

It must not act as an authoritative source of external market facts.

## 10.2 Recommended processing flow

1. Receive the original business description.
2. Send the text and explicit extraction instructions to the chosen LLM.
3. Request structured output.
4. Validate the returned data against a schema.
5. Check for missing fields and invalid types.
6. Preserve the original description alongside the interpretation.
7. Display assumptions and unknowns distinctly.
8. Allow user edits.
9. Generate validation questions and a plan from the confirmed ICP draft.
10. Export the result only after user review.

A single model call may be sufficient for the earliest implementation, provided the result is validated and the workflow remains understandable.

Do not add a complex multi-agent system without evidence that it improves the product.

## 10.3 Avoiding invented details

The system must not invent:

- Minimum company size.
- Revenue requirements.
- Budgets.
- Market statistics.
- Customer demand.
- Verified purchasing authority.
- Actual buying intent.
- External research findings.
- Existing customer evidence.

When a detail is missing, the output should mark it unknown or suggest a question.

## 10.4 Structured output

Use structured model output where supported.

An appropriate schema can enforce field types and required properties.

However, valid JSON is not proof of factual accuracy.

Official reference:

https://developers.openai.com/api/docs/guides/structured-outputs

The architecture should avoid depending unnecessarily on one specific LLM provider.

## 10.5 Error handling

Handle:

- API authentication failures.
- Rate limits.
- Timeouts.
- Empty output.
- Malformed output.
- Unsupported schema features.
- Provider refusals.
- Context-length limits.
- Network failures.
- Budget limits.

Show clear errors and preserve the user's input.

Never show a fabricated successful result when generation fails.

## 10.6 Human review

The founder should always be able to change the generated ICP, reject assumptions and revise the validation plan.

The app's role is to improve the founder's reasoning, not replace it.

---

# 11. Application Architecture

## 11.1 Confirmed Implementation Architecture

The application has been implemented with a clean, low-maintenance architecture:

- **Backend:** FastAPI (Python 3.12) managed via uv virtual environment (env).
- **Frontend:** Pure semantic, high-performance HTML5, custom CSS (Editorial Laboratory design system following production-landing-page-design), and pure Vanilla JavaScript. No React or Next.js build complexity.
- **LLM Engine:** Google AI Studio Gemini 3 family via the official google-genai SDK:
  - **Primary Model:** gemini-3.8-flash (engineered for high-intelligence reasoning, structured JSON schemas, and Free Tier compatibility).
  - **Fallback Model:** gemini-3.5-flash-lite (automatically engaged on HTTP 429 quota exhaustion).
- **Two-Stage Ingestion Pipeline:**
  - **Stage 1 (Brief Distillation):** Raw, conversational, or Wispr Flow-dictated English text is distilled into a compact, editable DistilledBrief JSON containing only essential fields and 3–4 precision search queries.
  - **Stage 2 (Non-Blocking Market Grounding):** Queries official, keyless public JSON APIs (**Hacker News Algolia**, **Wikipedia Action API**, and **StackExchange API**) and extracts target URLs locally via **Trafilatura** (with r.jina.ai cloud fallback). Zero flaky scrapers, no DuckDuckGo rate blocks.
  - **Stage 3 (ICP & Persona Compilation):** Compiles the structured ICP, Assumption Ledger, Buyer Persona Matrix (Module 4), Mom-Test Validation Questions (Module 5), and Validation Plan (Module 6) in a single structured-output call (< 3,800 tokens total).
- **Disk Caching:** SHA-256 content-hash caching to enable instant 0-token repeat runs.
- **Export Formats:** Clean Markdown (.md) with explicit epistemic tags and structured JSON (.json).


## 11.2 API key security

If a hosted LLM API is used:

- Store the API key on the server.
- Never expose it in browser code.
- Never commit it to a public repository.
- Provide an environment-variable example without actual secrets.
- Return safe error messages without leaking credentials.

## 11.3 Persistence

The first version does not require a user database or account system.

Prefer a simple workflow in which the user can generate, edit and export the result.

Optional browser-local persistence may be added if useful, but the application must explain how stored data can be cleared.

Do not introduce server-side history storage unless it provides a clear benefit.

## 11.4 Infrastructure

The initial version should not require:

- A dedicated GPU.
- A vector database.
- A large business database.
- Web scraping infrastructure.
- Multiple autonomous agents.
- A complex task queue.
- A CRM integration.
- An elaborate authentication system.

These are unnecessary for the core product definition.

---

# 12. Privacy and User Trust

The user may include business-sensitive information in their description.

The product should:

- Explain how the description is processed.
- Avoid retaining user content unnecessarily.
- Use HTTPS in production.
- Protect API credentials.
- Avoid logging sensitive input by default.
- Provide a way to clear locally stored data.
- Review the AI provider's data-handling terms.
- Avoid sending unnecessary confidential information to third-party models.

Open-sourcing the application does not automatically make every deployment secure or compliant.

Do not claim the application is fully compliant with every privacy law without reviewing the applicable requirements and actual deployment.

---

# 13. Visual and User Experience Guidelines

The application should feel like a practical founder tool, not a generic chatbot page.

## 13.1 Design principles

- Clear visual hierarchy.
- Readable text.
- Minimal unnecessary decoration.
- Clear progress through the workflow.
- Obvious editing controls.
- Transparent assumptions and unknowns.
- Helpful empty states.
- Responsive layout.
- Visible success and error states.
- Accessible form labels and keyboard navigation.

## 13.2 Suggested interface

### Screen 1: Business brief

Explain the purpose of the tool and provide a large description field.

### Screen 2: ICP review

Display the structured ICP and allow the user to correct the AI's interpretation.

### Screen 3: Assumptions and validation

Show the assumptions, unknowns, buyer-role suggestions and questions to test them.

### Screen 4: Final report

Display the completed report with edit, copy and export options.

A single-page application with clear sections is sufficient if it makes the workflow easy to understand.

Do not build unnecessary dashboards, analytics pages or complex navigation.

---

# 14. Non-Goals

The initial release must not attempt to:

- Search the entire internet for businesses.
- Maintain a database of business contact information.
- Scrape LinkedIn.
- Verify real email addresses.
- Automatically send outreach.
- Predict purchase probability.
- Guarantee that a generated ICP is correct.
- Provide market statistics without evidence.
- Replace customer interviews.
- Introduce a multi-agent autonomous architecture.
- Support complicated user organisations and account permissions.
- Become a full CRM or sales engagement suite.

Future expansion must be based on a demonstrated need, not merely on technical possibility.

---

# 15. Evaluation and Testing

The first version should be tested on business descriptions from several industries.

Possible test cases include:

- A solar installation business.
- A software development agency.
- A SaaS founder.
- A recruitment service.
- A manufacturing supplier.
- A consultant with a vague service description.
- A business with conflicting or missing constraints.
- A very long business description.

These examples are a proposed test set, not evidence of completed testing.

## 15.1 What to evaluate

### Constraint preservation

Did the application preserve explicit requirements and exclusions?

### Assumption transparency

Did it distinguish user-provided information from generated assumptions?

### Unknown handling

Did it identify missing details instead of inventing them?

### Structure quality

Was the ICP organised into useful, consistent fields?

### Validation usefulness

Were the suggested questions linked to real uncertainties in the profile?

### Editability

Could a user correct an incorrect interpretation easily?

### Export quality

Did Markdown and JSON preserve the same substantive information?

### Reliability

Did the application handle malformed responses, empty inputs and provider failures safely?

## 15.2 Do not fabricate evaluation results

Do not claim that the tool has a particular accuracy percentage, has validated demand or outperforms existing products unless those findings come from an actual documented evaluation.

If a test is synthetic or uses manually constructed scenarios, label it accordingly.

---

# 16. Development Plan

## Phase 1: Functional skeleton

Build the input form, the server-side generation endpoint and the basic result display.

Verify that the application works on a real business description.

## Phase 2: Structured ICP generation

Add schema validation and clear output sections.

Test short, long, vague and conflicting descriptions.

## Phase 3: Assumption ledger

Introduce the distinction between user-provided information, interpretation, assumptions and unknowns.

Ensure the distinction is reflected in the UI and exported output.

## Phase 4: Validation questions

Generate useful questions tied to the outstanding assumptions.

Allow edits.

## Phase 5: Export

Support clean Markdown and JSON output.

## Phase 6: Presentation and polish

Improve layout, loading states, errors, editing and responsive behaviour.

Remove placeholder content and obvious demonstration-only elements.

## Phase 7: Testing and deployment

Test the entire workflow, secure API credentials and deploy a publicly accessible version.

Verify that a new visitor can use the demonstration without needing private developer access.

## Phase 8: Portfolio integration

Present ICP Clarity Lab as a featured project in a newly built personal portfolio.

Explain the problem, design choices, limitations, development process and role of Wispr Flow.

Do not treat the project alone as a substitute for the requested personal portfolio.

---

# 17. Competition Submission Plan

The official submission instructions must be checked immediately before submission:

https://wispr-seven-day-challenge.wispr-flow-5934.chatgpt.site/

The published deadline is November 4, 2026.

## 17.1 Portfolio

Create a new, publicly accessible portfolio using Emergent and Wispr Flow.

It should communicate:

- Who the founder is.
- What problems they care about.
- What they have attempted to build.
- What they learned from those experiences.
- How they approach problem-solving.
- Why they created ICP Clarity Lab.
- What the project demonstrates about their capabilities.

Do not invent professional achievements, customers, revenue, partnerships or project outcomes.

## 17.2 Featured project case study

The portfolio should describe ICP Clarity Lab as a focused product experiment.

Show:

- The original problem.
- The intended user.
- The product's workflow.
- The difference between facts and assumptions.
- A real example of generating an ICP.
- Limitations and unresolved questions.
- What could be improved next.

If actual user testing has not occurred, state that honestly.

## 17.3 Demo video

Prepare a clear video explaining:

1. The problem being addressed.
2. Why the problem matters to the founder.
3. What ICP Clarity Lab does.
4. A real walkthrough.
5. How Wispr Flow helped during the building process.
6. Important design decisions and what was learned.

Follow any recording and submission instructions specified on the official challenge page.

## 17.4 Work-setup grant answer

The challenge requests a description of how a $3,000 work-setup grant would be used.

Prepare a specific, realistic plan based on actual development and work needs.

Do not invent purchases, budgets or equipment requirements merely to make the response sound impressive.

## 17.5 Public announcement

Prepare an honest LinkedIn or X post describing what was built and the role of voice in the development process.

Follow the official challenge requirements for tagging Wispr Flow and Emergent.

Do not claim to have won or received an internship before it has happened.

## 17.6 Submission quality

The portfolio should be usable on a public link.

The project should work in a fresh browser session, contain no private credentials and provide a demonstration that does not depend on the judge having access to the developer's environment.

---

# 18. Acceptance Criteria

The initial release is ready for demonstration when:

- A user can enter a business description.
- The application can generate a structured ICP.
- Required output fields are validated.
- Explicit exclusions are preserved.
- Missing information is identified.
- Assumptions remain distinguishable from facts.
- Buyer roles are presented as suggestions.
- Validation questions are provided.
- The user can edit the result.
- Markdown and JSON exports work.
- API failures are handled gracefully.
- Credentials are not exposed in client code.
- The application runs without requiring unnecessary infrastructure.
- A public deployment is accessible to a visitor.
- The accompanying case study accurately describes what has and has not been tested.

This acceptance list is a proposed release checklist. Completing it does not guarantee competition success or commercial adoption.

---

# 19. Instructions for AI Coding Agents

Before implementing features:

1. Read this document.
2. Keep the project focused on ICP clarification.
3. Do not expand it into a lead database or full sales platform.
4. Prefer small, maintainable modules.
5. Use structured outputs and validation where supported.
6. Preserve user input and explicit constraints.
7. Never invent market facts.
8. Make assumptions and unknowns visible.
9. Keep API credentials secure.
10. Provide useful error handling.
11. Include tests for important behaviours.
12. Avoid unnecessary paid services and infrastructure.
13. Do not claim validation results without evidence.
14. Do not silently introduce new product scope.
15. Update this document when a material, approved decision changes.

When a feature is unnecessary for the initial user journey, leave it out.

The priority is a small, complete, understandable application—not the largest possible feature set.

---

# 20. Final Principle

ICP Clarity Lab should help a founder think more clearly about their ideal customers.

The LLM should organise the founder's ideas, make assumptions explicit and suggest practical questions for validating them.

The application must not make the founder believe that a polished AI-generated document is equivalent to real-world market validation.

The product should remain small, useful, transparent and easy to demonstrate.

For the competition, the application is one part of the story. The broader portfolio must also show the founder's own thinking, creativity, ownership and effective use of Wispr Flow.