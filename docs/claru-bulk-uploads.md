# Claru bulk upload guide

Open **Claru Deliveries**, create or open a delivery batch, and choose **Bulk upload**.

1. Enter shared capture details and a reference prefix. Country, collector, site, camera and mount can come from the batch. Enter the actual recording time; a file's modification date is not its capture time.
2. Select multiple MP4 videos. Each video becomes a separate clip. The form reads duration where possible and leaves it editable.
3. Review each clip's reference, category, recording time and duration. Open **Capture details and related files** for exceptions or sidecars. Large selections have pages of 20 clips; shared changes apply across all pages.
4. Confirm that all four consent statements are true for every selected clip. Remove any clip that does not meet them. Choose **Add clips to queue**.
5. Choose **Start queue**. Clips upload one at a time, with individual progress. A failed clip does not block the rest. Use **Retry failed**, or an individual clip's **Retry** button, after addressing the error.
6. For a clip marked **Ready to seal**, choose **Open clip**, review the delivery, then **Seal submission → Seal and submit**. Sealing needs its own permission and does not happen automatically. Track the processing and review result afterward.

You can browse other pages of the admin panel while the queue runs. The header's **Upload queue** button opens the queue across all batches. Queue controls apply to the whole queue; individual pause and resume buttons apply to one clip.

Keep the browser tab open. **Pause queue** saves completed work before stopping. After a browser refresh, choose **Reselect queue files** to select original unfinished files together, then **Resume queue**. Filenames and byte sizes must match. If multiple files share those details, use the individual clip's **Reselect files** button. Completed files and saved multipart checkpoints are reused.

Queue metadata stays in this browser tab's session. Original files and signed upload URLs are never stored in browser storage. Logging out or changing accounts stops transfers and clears the queue. Created submissions remain in their delivery batches; removing a queue entry does not delete a submission.

Follow **Current project requirements** and the required/optional labels. Declare the duration you measured; Claru checks actual media at seal. Each clip reference is unique across the team's batches. Keep the same reference for retries, refusals and expired drafts; corrected footage after a rejection needs a new reference.
