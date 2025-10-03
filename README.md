# LobbyShotz (Weekly, No Email) — Stable
This version is **more forgiving**: even if some sites fail, it will still build and publish the report so you can see progress. It also uploads the whole `out/` folder as a downloadable artifact in the Actions run.

## Steps (non-technical)
1. Create a GitHub repo named **lobbyshotz** (Public).
2. Upload all files from this ZIP (keep the folders as-is).
3. Go to **Actions → LobbyShotz Weekly → Run workflow**.
4. After it finishes, go to **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** and **/** (root) → Save
5. Open your report at:  
   `https://<your-username>.github.io/lobbyshotz/<YYYY-MM-DD>/index.html`
6. It will now run **every Monday 06:00 UTC**.

If you see errors, open the run and download the **lobbyshotz-out** artifact to inspect screenshots and logs.