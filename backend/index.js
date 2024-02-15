const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const { generateFile } = require("./generateFile");
const { executeCpp } = require("./executeCpp");
const { executePy } = require("./executePy");
const {addJobToQueue} = require('./jobQueue');
const Job = require("./models/Job");
main().catch(err => console.log(err));

// 127.0.0.1:27017
async function main() {
    await mongoose.connect('mongodb://localhost/compilerdb');
}
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/status", async (req, res) => {
    const jobId = req.query.id;
    if (jobId === undefined) {
        return res
            .status(400)
            .json({ success: false, error: "missing id query parameter" });
    }
    const job = await Job.findById(jobId);

    if (job === undefined) {
        return res.status(400).json({ success: false, error: "couldn't find job" });
    }

    return res.status(200).json({ success: true, job });
})

app.post("/run", async (req, res) => {
    const { language = "cpp", code } = req.body;

  console.log(language, "Length:", code.length);

  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty code body!" });
  }
  const filepath = await generateFile(language, code);
  const job = await new Job({ language, filepath }).save();
  const jobId = job["_id"];
  addJobToQueue(jobId);
  res.status(201).json({ jobId });
    }
)

app.listen(5000, () => {
    console.log("Listening on 5000....");
})