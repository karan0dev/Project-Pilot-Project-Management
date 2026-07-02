const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Activity = require('./models/Activity');

// Load env variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/projectpilot');
    console.log('Seed: Connected to Database...');

    // Clear existing collections
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    console.log('Seed: Cleared all old data...');

    // 1. Create Admins and Users
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@projectpilot.com',
      password: 'adminpassword', // Will be hashed via pre-save hook
      role: 'admin'
    });

    const standardUser1 = await User.create({
      username: 'alex',
      email: 'alex@projectpilot.com',
      password: 'userpassword123',
      role: 'user'
    });

    const standardUser2 = await User.create({
      username: 'emily',
      email: 'emily@projectpilot.com',
      password: 'userpassword123',
      role: 'user'
    });

    console.log('Seed: Created Users...');

    // 2. Create Sample Projects
    const project1 = await Project.create({
      title: 'ProjectPilot System Implementation',
      description: 'Implement full-stack project tracking web app with Node, Express, MongoDB, and Bento glassmorphism CSS layout.',
      category: 'Development',
      status: 'active',
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      createdBy: adminUser._id
    });

    const project2 = await Project.create({
      title: 'Tactile Interface Brand Redesign',
      description: 'Create a brand new design guidelines document using 3D claymorphic UI structures and light/dark theme specifications.',
      category: 'Design',
      status: 'active',
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (OVERDUE deadline!)
      createdBy: standardUser1._id
    });

    const project3 = await Project.create({
      title: 'Community Launch & Marketing Campaign',
      description: 'Plan public launch announcements, product hunts release calendar, and initial newsletter copy draftings.',
      category: 'Marketing',
      status: 'planning',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      createdBy: standardUser2._id
    });

    const project4 = await Project.create({
      title: 'Legacy Database Clean-up',
      description: 'Identify old unindexed schemas and build migration steps for archival storage.',
      category: 'Operations',
      status: 'completed',
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      progress: 100,
      createdBy: adminUser._id
    });

    console.log('Seed: Created Projects...');

    // 3. Create Sample Tasks for Project 1 (System Implementation)
    const p1_t1 = await Task.create({
      title: 'Setup MongoDB database schemas',
      description: 'Define Mongoose schemas for Users, Projects, Tasks, and Activities, linking references appropriately.',
      projectId: project1._id,
      assignedTo: standardUser1._id,
      priority: 'high',
      status: 'completed',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });

    const p1_t2 = await Task.create({
      title: 'Build Express REST endpoints',
      description: 'Create controller routing handlers and JWT protection middlewares for CRUD actions.',
      projectId: project1._id,
      assignedTo: standardUser2._id,
      priority: 'medium',
      status: 'in_progress',
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    });

    const p1_t3 = await Task.create({
      title: 'Integrate Bento UI dashboards',
      description: 'Build HTML templates in public folder and link CSS variables supporting claymorphism visual highlights.',
      projectId: project1._id,
      assignedTo: standardUser1._id,
      priority: 'high',
      status: 'pending',
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
    });

    // Update Project 1 Progress (1 out of 3 completed = 33%)
    const p1Total = 3;
    const p1Completed = 1;
    project1.progress = Math.round((p1Completed / p1Total) * 100);
    await project1.save();

    // 4. Create Sample Tasks for Project 2 (Brand Redesign - Overdue Project)
    const p2_t1 = await Task.create({
      title: 'Generate SVG assets and 3D mockups',
      description: 'Create 3D glowing sphere graphics to render floating background design illustrations.',
      projectId: project2._id,
      assignedTo: standardUser1._id,
      priority: 'high',
      status: 'completed',
      deadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    });

    const p2_t2 = await Task.create({
      title: 'Review contrast ratios of glass panels',
      description: 'Ensure readability of primary text colors on glowing backdrop-blur surfaces across themes.',
      projectId: project2._id,
      assignedTo: standardUser2._id,
      priority: 'medium',
      status: 'pending',
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // OVERDUE TASK!
    });

    // Update Project 2 Progress (1 out of 2 completed = 50%)
    project2.progress = 50;
    await project2.save();

    // 5. Create Tasks for Project 4 (Legacy DB clean-up - Completed project)
    await Task.create({
      title: 'Run indexing migrations',
      description: 'Create unique indices on email field and check search performance constraints.',
      projectId: project4._id,
      assignedTo: adminUser._id,
      priority: 'low',
      status: 'completed',
      deadline: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    console.log('Seed: Created Tasks & Updated Progress...');

    // 6. Create Sample Activity Logs
    await Activity.create({
      description: 'System seed initialized.',
      user: adminUser._id
    });
    
    await Activity.create({
      description: `Project '${project1.title}' created by admin.`,
      user: adminUser._id,
      project: project1._id
    });

    await Activity.create({
      description: `Task '${p1_t1.title}' marked as COMPLETED by alex.`,
      user: standardUser1._id,
      project: project1._id,
      task: p1_t1._id
    });

    await Activity.create({
      description: `Project '${project2.title}' created by alex.`,
      user: standardUser1._id,
      project: project2._id
    });

    await Activity.create({
      description: `Task '${p2_t1.title}' marked as COMPLETED by alex.`,
      user: standardUser1._id,
      project: project2._id,
      task: p2_t1._id
    });

    await Activity.create({
      description: `Task '${p2_t2.title}' in '${project2.title}' became OVERDUE.`,
      user: adminUser._id,
      project: project2._id,
      task: p2_t2._id
    });

    console.log('Seed: Logged Activities...');
    console.log('Seed Completed Successfully! 🎉');
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Seed Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
