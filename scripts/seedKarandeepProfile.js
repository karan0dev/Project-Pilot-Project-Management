const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

dotenv.config();

const PROFILE = {
  username: 'Karandeep Singh',
  email: 'karandeep@projectpilot.com',
  password: 'karandeep123',
  role: 'user'
};

const projects = [
  {
    title: 'SkyCast - Smart Weather Forecast Dashboard',
    category: 'Weather App',
    deadline: new Date('2026-06-08T12:00:00.000Z'),
    description:
      'Premium compact weather dashboard with live Open-Meteo data, geolocation, triple themes, custom canvas trend charts, 7-day forecast cards, shimmer search, AQI/UV/sunrise-sunset indicators, and LocalStorage persistence.',
    tasks: [
      {
        title: 'Build compact premium weather dashboard',
        description:
          'Created the glassmorphic weather workspace with balanced cards, modern typography, micro-animations, and responsive layout polish.',
        priority: 'high',
        deadline: new Date('2026-05-30T12:00:00.000Z')
      },
      {
        title: 'Connect geolocation and live weather updates',
        description:
          'Integrated browser geolocation, Open-Meteo weather data, fallback location behavior, and automatic 60-second clock/weather refreshes.',
        priority: 'high',
        deadline: new Date('2026-06-02T12:00:00.000Z')
      },
      {
        title: 'Create triple-theme engine and shimmer search',
        description:
          'Delivered Purple, Warm, and Midnight themes with LocalStorage persistence plus an animated search bar with autocomplete suggestions.',
        priority: 'medium',
        deadline: new Date('2026-06-05T12:00:00.000Z')
      },
      {
        title: 'Draw forecast charts and weather indicators',
        description:
          'Built canvas wave charts, 7-day forecast cards, AQI/UV gauges, precipitation charts, and sunrise/sunset trajectory details.',
        priority: 'high',
        deadline: new Date('2026-06-08T12:00:00.000Z')
      }
    ]
  },
  {
    title: 'EduGraph - Records Analytics Portal',
    category: 'EdTech Analytics',
    deadline: new Date('2026-06-18T12:00:00.000Z'),
    description:
      'Premium EdTech analytics workspace for educators with a glassmorphic landing portal, CSV importer, KPI recalculations, Chart.js visual reports, student directory profiles, and LocalStorage persistence.',
    tasks: [
      {
        title: 'Design premium EduGraph welcome portal',
        description:
          'Created the glassmorphic SaaS-style welcome page with dashboard mockup, floating sparkles, 3D character framing, and onboarding steps.',
        priority: 'high',
        deadline: new Date('2026-06-10T12:00:00.000Z')
      },
      {
        title: 'Implement CSV importer and analytics workspace',
        description:
          'Built client-side CSV parsing, dynamic header mapping, live upload flow, and automatic workspace population from spreadsheet data.',
        priority: 'high',
        deadline: new Date('2026-06-13T12:00:00.000Z')
      },
      {
        title: 'Build Chart.js visual reporting suite',
        description:
          'Added academic trend charts, subject radar charts, attendance scatter plots, grade distributions, and recalculated KPI cards.',
        priority: 'high',
        deadline: new Date('2026-06-16T12:00:00.000Z')
      },
      {
        title: 'Add student directory and local persistence',
        description:
          'Completed searchable tables, sortable records, profile modals with teacher comments, pagination, and browser LocalStorage persistence.',
        priority: 'medium',
        deadline: new Date('2026-06-18T12:00:00.000Z')
      }
    ]
  }
];

async function upsertProfile() {
  let user = await User.findOne({ email: PROFILE.email }).select('+password');

  if (!user) {
    user = new User(PROFILE);
  } else {
    user.username = PROFILE.username;
    user.email = PROFILE.email;
    user.password = PROFILE.password;
    user.role = PROFILE.role;
  }

  await user.save();
  return user;
}

async function upsertProject(user, projectSeed) {
  let project = await Project.findOne({
    title: projectSeed.title,
    createdBy: user._id
  });

  if (!project) {
    project = new Project({
      title: projectSeed.title,
      createdBy: user._id
    });
  }

  project.description = projectSeed.description;
  project.category = projectSeed.category;
  project.status = 'completed';
  project.deadline = projectSeed.deadline;
  project.progress = 100;
  await project.save();

  for (const taskSeed of projectSeed.tasks) {
    let task = await Task.findOne({
      title: taskSeed.title,
      projectId: project._id
    });

    if (!task) {
      task = new Task({
        title: taskSeed.title,
        projectId: project._id
      });
    }

    task.description = taskSeed.description;
    task.assignedTo = user._id;
    task.priority = taskSeed.priority;
    task.status = 'completed';
    task.deadline = taskSeed.deadline;
    await task.save();
  }

  await Task.updateMany(
    { projectId: project._id, assignedTo: user._id },
    { $set: { status: 'completed' } }
  );

  await Activity.findOneAndUpdate(
    {
      user: user._id,
      project: project._id,
      description: `Project '${project.title}' marked as completed for Karandeep Singh.`
    },
    {
      user: user._id,
      project: project._id,
      description: `Project '${project.title}' marked as completed for Karandeep Singh.`
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return project;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/projectpilot');

  const user = await upsertProfile();
  const savedProjects = [];

  for (const projectSeed of projects) {
    savedProjects.push(await upsertProject(user, projectSeed));
  }

  const completedTaskCount = await Task.countDocuments({
    assignedTo: user._id,
    status: 'completed'
  });

  console.log('Karandeep Singh profile is ready.');
  console.log(`Email: ${PROFILE.email}`);
  console.log(`Password: ${PROFILE.password}`);
  console.log(`Completed projects: ${savedProjects.length}`);
  console.log(`Completed tasks: ${completedTaskCount}`);
}

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
