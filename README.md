# repo2rakugo

GitHub repository to rakugo batch service.

## MVP

1. Open a GitHub repository.
2. Press the repo2rakugo button.
3. Submit an email address.
4. The extension sends a JobSpec to the REST API.
5. GitHub Actions performs asynchronous generation.
6. JSON and MP3 are delivered by email.

## Architecture

GitHub repository -> Chrome Extension -> Cloudflare Worker -> GitHub Actions -> LLM/TTS -> JSON/MP3 -> Email

## Repository rules

- Runtime code contains no Japanese text.
- Japanese creative content is data, not code.
- The REST boundary is JSON.
- Jobs are asynchronous.
