/* ------------------------------------------------------------------ */
/* API Service Client for Backend Integration                         */
/* ------------------------------------------------------------------ */
var API_URL = "http://localhost:5000/api";

var Api = {
  isAvailable: false,
  candidateName: "",

  setCandidate(name) {
    this.candidateName = (name || "").trim();
  },

  getHeaders(extra) {
    var h = { "Content-Type": "application/json" };
    if (this.candidateName) {
      h["X-Candidate-Name"] = encodeURIComponent(this.candidateName);
    }
    if (extra) {
      for (var k in extra) {
        h[k] = extra[k];
      }
    }
    return h;
  },

  async checkHealth() {
    try {
      var res = await fetch(API_URL + "/jobs", { method: "GET" });
      this.isAvailable = res.ok;
      return res.ok;
    } catch (e) {
      this.isAvailable = false;
      return false;
    }
  },

  async getProfile() {
    try {
      var res = await fetch(API_URL + "/jobseeker/profile", {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using local profile", e);
    }
    return null;
  },

  async updateProfile(profileData) {
    try {
      var res = await fetch(API_URL + "/jobseeker/profile", {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(profileData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend updateProfile failed", e);
    }
    return null;
  },

  async getDeck() {
    try {
      var res = await fetch(API_URL + "/jobs/deck", {
        headers: this.getHeaders()
      });
      if (res.ok) {
        var jobs = await res.json();
        return jobs;
      }
    } catch (e) {
      console.warn("Backend getDeck failed, falling back to local jobs", e);
    }
    return null;
  },

  async getAllJobs() {
    try {
      var res = await fetch(API_URL + "/jobs");
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend getAllJobs failed", e);
    }
    return null;
  },

  async passJob(jobId) {
    try {
      await fetch(API_URL + "/interactions/pass", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ jobId: jobId })
      });
    } catch (e) {
      console.warn("Backend passJob failed", e);
    }
  },

  async saveJob(jobId) {
    try {
      await fetch(API_URL + "/interactions/save", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ jobId: jobId })
      });
    } catch (e) {
      console.warn("Backend saveJob failed", e);
    }
  },

  async applyJob(jobId, isTailoredCv, cvSnapshotJson) {
    try {
      var res = await fetch(API_URL + "/interactions/apply", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          jobId: jobId,
          isTailoredCv: !!isTailoredCv,
          cvSnapshotJson: cvSnapshotJson ? JSON.stringify(cvSnapshotJson) : null
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend applyJob failed", e);
    }
    return null;
  },

  async getSaved() {
    try {
      var res = await fetch(API_URL + "/interactions/saved", {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend getSaved failed", e);
    }
    return [];
  },

  async getApplied() {
    try {
      var res = await fetch(API_URL + "/interactions/applied", {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend getApplied failed", e);
    }
    return [];
  },

  async simulateMatch(applicationId) {
    try {
      var res = await fetch(API_URL + "/interactions/simulate-match/" + applicationId, {
        method: "POST",
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend simulateMatch failed", e);
    }
    return null;
  },

  async getConversations() {
    try {
      var res = await fetch(API_URL + "/conversations", {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend getConversations failed", e);
    }
    return [];
  },

  async getConversation(id) {
    try {
      var res = await fetch(API_URL + "/conversations/" + id, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend getConversation failed", e);
    }
    return null;
  },

  async sendMessage(convId, content) {
    try {
      var res = await fetch(API_URL + "/conversations/" + convId + "/messages", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ content: content })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend sendMessage failed", e);
    }
    return null;
  }
};
