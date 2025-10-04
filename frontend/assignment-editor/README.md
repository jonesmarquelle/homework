# Frontend: Assignment Editor

A React component built with Vite that visualizes and allows editing of academic assignments from JSON data.

> **Note**: This is part of the homework management system. See the main README.md for full project setup.

## Features

- **Drag & Drop Upload**: Drag and drop JSON files directly onto the page for instant parsing
- **File Validation**: Validates JSON structure and file format with helpful error messages
- **Data Visualization**: Displays assignments in a clean, card-based layout
- **Inline Editing**: All assignment fields are editable (name, due date, due time, submission link)
- **Date Parsing**: Uses `date-fns` to parse and combine date/time strings into Date objects
- **Action Buttons**: Export to Google Calendar and View on Kanban Board (with console logging)
- **Responsive Design**: Clean, minimal CSS with mobile-friendly layout
- **Scrollable List**: Vertical scrolling for long assignment lists

## Project Structure

```
assignment-editor/
├── src/
│   ├── components/
│   │   └── AssignmentEditor.tsx  # Main component
│   ├── App.tsx                   # Demo app with sample data
│   ├── App.css                   # Styling
│   └── main.tsx                  # Entry point
├── package.json
└── README.md
```

## Data Structure

The component accepts data in the following JSON format:

```json
{
  "class_name": "Introduction to Astrophysics",
  "course_code": "PHYS 210",
  "assignments": [
    {
      "name": "Problem Set 1 (Stellar Parallax)",
      "due_date": "2025-10-19",
      "due_time": "11:59 PM",
      "submission_link": "https://canvas.example.edu/courses/123/assignments/456"
    }
  ]
}
```

## Usage

### Drag & Drop
Simply drag and drop a JSON file onto the drop zone at the top of the page. The component will automatically parse and display the assignments.

### Programmatic Usage
```tsx
import AssignmentEditor from './components/AssignmentEditor';

const sampleData = {
  class_name: "Introduction to Astrophysics",
  course_code: "PHYS 210",
  assignments: [
    // ... assignment objects
  ]
};

function App() {
  return <AssignmentEditor data={sampleData} />;
}
```

### Sample Files
A sample JSON file (`sample-assignments.json`) is included in the `public` folder for testing the drag and drop functionality.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Technologies Used

- **React 18** with TypeScript
- **Vite** for fast development and building
- **date-fns** for robust date parsing and formatting
- **CSS3** with Flexbox for responsive layout

## Component Features

### AssignmentEditor Props
- `data`: AssignmentData object containing class info and assignments array

### State Management
- Uses React's `useState` hook to manage assignment list
- Automatically parses date/time strings into Date objects
- Updates state when user edits any field

### Styling
- Clean, minimal design with gradient header
- Card-based layout for assignments
- Hover effects and smooth transitions
- Responsive design for mobile devices
- Custom scrollbar styling