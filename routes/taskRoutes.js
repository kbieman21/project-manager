const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const Task = require("../models/Task");
const Project = require("../models/Project");

const taskRouter = express.Router();

// Protects all rotes in this router
taskRouter.use(authMiddleware);

/**
 * GET /api/projects/:projectId/tasks
 */
taskRouter.get("/:projectId/tasks", async (req, res) => {
  try {
    const userTasks = await Task.find({
      project: req.params.projectId,
      // user: req.user._id,
    });

    res.json(userTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:projectId/tasks
 */
taskRouter.post("/:projectId/tasks", async (req, res) => {
  try {
    const newTask = await Task.create({
      ...req.body,
      project: req.params.projectId,
      // user: req.user._id,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/projects/projectId/tasks/:taskId
 */
taskRouter.put("/:projectId/tasks/:taskId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

     if (!task) {
      return res.status(404).json({ error: "Task not Found!" });
    }

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: "Task does not Belong to any project!" });
    }

    if (project.user.toString() === req.user._id) {
      const newTask = await Task.findByIdAndUpdate(req.params.taskId, req.body, {
        new: true,
        runValidators: true,
      });
      res.status(200).json(newTask);
    }else{
      res.status(403).json({ error: "You have no access to this task" });

    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/projects/projectId/tasks/:taskId
 */
taskRouter.delete("/:projectId/tasks/:taskId", async (req, res) => {
  try {
    // 1. Find the task by ID
    const taskToDelet = await Task.findById(req.params.taskId);

    if (!taskToDelet) {
      return res.status(404).json({ error: "Task not found!" });
    }

     // 2. Find the project the task belongs to
     const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: "Task does not belong to any project!" });
    }


    // 3. Authorization check (Does the user own the project?)
    if (req.user._id !== project.user.toString()) {
      return res
        .status(403)
        .json({ error: "User is not authorized to delete this task" });
    }

    // 4. Delete the task
    const task = await Task.findByIdAndDelete(req.params.taskId);

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = taskRouter;
