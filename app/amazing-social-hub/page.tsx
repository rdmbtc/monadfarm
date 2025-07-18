import { AmazingSocialHub } from '../../components/amazing-social-hub';

export default function AmazingSocialHubPage() {
  return (
    <>
      <head>
        <title>🚀 MonFarm Amazing Social Hub - Real-time Collaboration</title>
        <meta name="description" content="Experience the future of social interaction with real-time chat, collaborative drawing, live cursors, and more!" />
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <script type="module" crossorigin="anonymous" src="https://cdn.jsdelivr.net/npm/react-together@latest/+esm"></script>
      </head>
      <AmazingSocialHub />
    </>
  );
}
