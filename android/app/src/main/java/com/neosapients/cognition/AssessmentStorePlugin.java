package com.neosapients.cognition;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

@CapacitorPlugin(name = "AssessmentStore")
public class AssessmentStorePlugin extends Plugin {
    private AssessmentDatabase database;

    @Override
    public void load() {
        database = new AssessmentDatabase(getContext());
    }

    @PluginMethod
    public void saveAssessment(PluginCall call) {
        JSObject record = call.getObject("record");
        if (record == null) {
            call.reject("Assessment record is required.");
            return;
        }

        String id = record.getString("id");
        String submittedAt = record.getString("submittedAt");
        if (id == null || submittedAt == null) {
            call.reject("Assessment record is invalid.");
            return;
        }

        try {
            ContentValues values = new ContentValues();
            values.put("id", id);
            values.put("submitted_at", submittedAt);
            values.put("record_json", record.toString());
            long result = database.getWritableDatabase().insertWithOnConflict(
                "assessment_submissions", null, values, SQLiteDatabase.CONFLICT_IGNORE
            );

            JSObject response = new JSObject();
            response.put("ok", true);
            response.put("id", id);
            response.put("status", "SAVED");
            response.put("storage", "SQLITE");
            response.put("duplicatePrevented", result == -1);
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Assessment could not be saved.", error);
        }
    }

    @PluginMethod
    public void setCallbackPreference(PluginCall call) {
        String id = call.getString("id");
        Boolean requested = call.getBoolean("requested");
        if (id == null || requested == null) {
            call.reject("Callback preference is invalid.");
            return;
        }

        ContentValues values = new ContentValues();
        values.put("callback_requested", requested ? 1 : 0);
        values.put("callback_requested_at", isoTimestamp());
        int changed = database.getWritableDatabase().update(
            "assessment_submissions", values, "id = ?", new String[]{id}
        );
        if (changed != 1) {
            call.reject("Assessment record was not found.");
            return;
        }

        JSObject response = new JSObject();
        response.put("ok", true);
        response.put("requested", requested);
        call.resolve(response);
    }

    @PluginMethod
    public void listAssessments(PluginCall call) {
        JSArray records = new JSArray();
        try (Cursor cursor = database.getReadableDatabase().query(
            "assessment_submissions",
            new String[]{"record_json", "callback_requested", "callback_requested_at"},
            null, null, null, null, "submitted_at DESC"
        )) {
            while (cursor.moveToNext()) {
                JSObject record = new JSObject(cursor.getString(0));
                if (!cursor.isNull(1)) record.put("callbackRequested", cursor.getInt(1) == 1);
                if (!cursor.isNull(2)) record.put("callbackRequestedAt", cursor.getString(2));
                records.put(record);
            }
            JSObject response = new JSObject();
            response.put("records", records);
            call.resolve(response);
        } catch (JSONException error) {
            call.reject("Assessment records could not be read.", error);
        }
    }

    @PluginMethod
    public void exportCsv(PluginCall call) {
        String filename = call.getString("filename");
        String content = call.getString("content");
        if (filename == null || content == null || !filename.matches("[A-Za-z0-9._-]+\\.csv")) {
            call.reject("CSV export is invalid.");
            return;
        }

        try {
            String destination;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                values.put(MediaStore.Downloads.MIME_TYPE, "text/csv");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/NeoSapients");
                ContentResolver resolver = getContext().getContentResolver();
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("Downloads destination is unavailable.");
                try (OutputStream stream = resolver.openOutputStream(uri, "w")) {
                    if (stream == null) throw new IllegalStateException("CSV destination is unavailable.");
                    stream.write(content.getBytes(StandardCharsets.UTF_8));
                }
                destination = Environment.DIRECTORY_DOWNLOADS + "/NeoSapients/" + filename;
            } else {
                File directory = getContext().getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
                if (directory == null) directory = getContext().getFilesDir();
                if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("Export directory is unavailable.");
                File file = new File(directory, filename);
                try (OutputStream stream = new FileOutputStream(file)) {
                    stream.write(content.getBytes(StandardCharsets.UTF_8));
                }
                destination = file.getAbsolutePath();
            }

            JSObject response = new JSObject();
            response.put("ok", true);
            response.put("path", destination);
            call.resolve(response);
        } catch (Exception error) {
            call.reject("CSV could not be exported.", error);
        }
    }

    private static String isoTimestamp() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(new Date());
    }

    private static class AssessmentDatabase extends SQLiteOpenHelper {
        private static final String NAME = "neosapients-assessments.sqlite";
        private static final int VERSION = 1;

        AssessmentDatabase(android.content.Context context) {
            super(context, NAME, null, VERSION);
        }

        @Override
        public void onConfigure(SQLiteDatabase db) {
            super.onConfigure(db);
            db.setForeignKeyConstraintsEnabled(true);
            db.enableWriteAheadLogging();
        }

        @Override
        public void onCreate(SQLiteDatabase db) {
            db.execSQL(
                "CREATE TABLE assessment_submissions (" +
                    "id TEXT PRIMARY KEY NOT NULL," +
                    "submitted_at TEXT NOT NULL," +
                    "record_json TEXT NOT NULL," +
                    "callback_requested INTEGER," +
                    "callback_requested_at TEXT" +
                ")"
            );
            db.execSQL("CREATE INDEX idx_assessment_submitted_at ON assessment_submissions(submitted_at)");
        }

        @Override
        public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            // Version 1 is the initial on-device schema.
        }
    }
}
