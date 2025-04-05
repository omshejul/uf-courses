# UF Courses Explorer

A modern, interactive course explorer for University of Florida graduate courses. Built with Next.js, React, and TypeScript.

## Features

- 🎓 Browse CS and ECE graduate courses
- 🔍 Advanced search and filtering capabilities
- 📱 Responsive grid and list views
- 🎨 Beautiful UI with dark mode support
- 👥 User authentication with Google
- 💬 Course insights and difficulty ratings
- 📂 Custom course categorization
- ✨ Drag and drop course reordering
- 🔄 Real-time updates

## Getting Started

1. Clone the repository:

```bash
git clone <your-repo-url>
cd uf-courses
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file with:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MONGODB_URI=your-mongodb-uri
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Drag & Drop**: [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)

## Project Structure

```
uf-courses/
├── app/                   # Next.js app directory
├── components/           # React components
│   └── ui/              # Reusable UI components
├── lib/                 # Utilities and helpers
│   ├── models/         # Database models
│   └── store/          # Zustand stores
├── public/             # Static assets
└── types/              # TypeScript type definitions
```

## Features in Detail

### Course Browsing

- Grid and list view options
- Expandable course cards with detailed information
- Course prerequisites and meeting times
- Core course indicators

### Search and Filtering

- Full-text search across course details
- Filter by department (CS/ECE)
- Predefined and custom categories
- Smart course acronym search

### User Features (Requires Login)

- Add and manage course insights
- Create custom course categories
- Rate course difficulty
- Personalized course order
- Anonymous posting option

### UI/UX

- Responsive design for all devices
- Dark mode support
- Smooth animations
- Drag and drop reordering
- Persistent user preferences

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
