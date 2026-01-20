import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";

/* ======================================================
   CREATE PROJECT
====================================================== */

export const createUserProject = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const { initial_prompt } = req.body;

    if (!initial_prompt || typeof initial_prompt !== "string") {
      return res.status(400).json({ message: "Invalid prompt" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.credits < 5) {
      return res.status(403).json({ message: "Insufficient credits" });
    }

    const project = await prisma.websiteProject.create({
      data: {
        name:
          initial_prompt.length > 50
            ? initial_prompt.substring(0, 47) + "..."
            : initial_prompt,
        initial_prompt,
        userId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalCreation: { increment: 1 },
        credits: { decrement: 5 },
      },
    });

    await prisma.conversation.create({
      data: {
        role: "user",
        content: initial_prompt,
        projectId: project.id,
      },
    });

    // ✅ respond once
    res.json({ projectId: project.id });

    // 🚀 background processing
    process.nextTick(() =>
      processProjectInBackground(project.id, initial_prompt, userId)
    );
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

/* ======================================================
   MAKE REVISION
====================================================== */

export const makeRevision = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params as { projectId: string };
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Invalid prompt" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.credits < 5) {
      return res.status(403).json({ message: "Insufficient credits" });
    }

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.conversation.create({
      data: { role: "user", content: message, projectId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 5 } },
    });

    // ✅ respond immediately
    res.json({ message: "Revision request accepted" });

    // 🚀 background job
    process.nextTick(() =>
      processRevisionInBackground(projectId, message, userId)
    );
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

/* ======================================================
   ROLLBACK VERSION
====================================================== */

export const rollbackToVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId, versionId } = req.params as {
      projectId: string;
      versionId: string;
    };

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: { versions: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const version = project.versions.find((v) => v.id === versionId);

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    await prisma.websiteProject.update({
      where: { id: projectId },
      data: {
        current_code: version.code,
        current_version_index: version.id,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "Website rolled back successfully.",
        projectId,
      },
    });

    return res.json({ message: "Rollback successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* ======================================================
   DELETE PROJECT
====================================================== */

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params as { projectId: string };

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await prisma.websiteProject.delete({
      where: { id: projectId, userId },
    });

    return res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* ======================================================
   PREVIEW PROJECT
====================================================== */

export const getProjectPreview = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params as { projectId: string };

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const project = await prisma.websiteProject.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({ project });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* ======================================================
   BACKGROUND HELPERS
====================================================== */

async function processProjectInBackground(
  projectId: string,
  prompt: string,
  userId: string
) {
  try {
    const enhance = await openai.chat.completions.create({
      model: "mistralai/devstral-2512:free",
      messages: [
        { role: "system", content: "Enhance website prompt clearly." },
        { role: "user", content: prompt },
      ],
    });

    const enhancedPrompt =
      enhance.choices[0].message.content || prompt;

    const codeRes = await openai.chat.completions.create({
      model: "mistralai/devstral-2512:free",
      messages: [
        { role: "system", content: "Return ONLY valid HTML." },
        { role: "user", content: enhancedPrompt },
      ],
    });

    const code = codeRes.choices[0].message.content?.trim();
    if (!code) throw new Error("Code generation failed");

    const cleanCode = code.replace(/```/g, "").trim();

    const version = await prisma.version.create({
      data: {
        code: cleanCode,
        description: "Initial version",
        projectId,
      },
    });

    await prisma.websiteProject.update({
      where: { id: projectId },
      data: {
        current_code: cleanCode,
        current_version_index: version.id,
      },
    });
  } catch (error) {
    console.error("Background project error:", error);

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: 5 } },
    });
  }
}

async function processRevisionInBackground(
  projectId: string,
  message: string,
  userId: string
) {
  try {
    const enhance = await openai.chat.completions.create({
      model: "mistralai/devstral-2512:free",
      messages: [
        { role: "system", content: "Enhance revision request." },
        { role: "user", content: message },
      ],
    });

    const enhanced =
      enhance.choices[0].message.content || message;

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId },
    });

    if (!project?.current_code) {
      throw new Error("No current code");
    }

    const codeRes = await openai.chat.completions.create({
      model: "mistralai/devstral-2512:free",
      messages: [
        { role: "system", content: "Return updated HTML only." },
        {
          role: "user",
          content: `Current code: ${project.current_code}\nChange: ${enhanced}`,
        },
      ],
    });

    const code = codeRes.choices[0].message.content?.trim();
    if (!code) throw new Error("Revision failed");

    const cleanCode = code.replace(/```/g, "").trim();

    const version = await prisma.version.create({
      data: {
        code: cleanCode,
        description: "Revision",
        projectId,
      },
    });

    await prisma.websiteProject.update({
      where: { id: projectId },
      data: {
        current_code: cleanCode,
        current_version_index: version.id,
      },
    });
  } catch (error) {
    console.error("Revision background error:", error);

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: 5 } },
    });
  }
}
