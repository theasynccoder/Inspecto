const express=require('express');
const router = express.Router();
const db = require('../config/dbConnect');

const { checklistSchema, sectionLabels } = require('../data/inspectionCategories');
const PDFService = require('../services/pdfService');
const SentimentService = require('../services/sentimentService');
const AnomalyService = require('../services/anomalyService');

router.get('/adminLogin', (req, res) => {
  // Pass empty error variable if none exists
  const error = req.query.error || null;
  res.render('adminLogin', { error });
});
// Update the dashboard route to handle success parameter
// Update the dashboard route to handle success parameter
router.get('/admin/dashboard', async (req, res) => {
  const success = req.query.success;
  const adminName = req.session.adminName;
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [inspectors] = await db.query('SELECT * FROM inspectors WHERE zone = ?', [zone]);
    const [restaurants] = await db.query('SELECT * FROM restaurants WHERE zone = ?', [zone]);
    const [reports] = await db.query('SELECT * FROM inspection_reports WHERE status="approved"');
    
    // Get complaints with sentiment data for the zone
    const [complaints] = await db.query(`
      SELECT c.*, r.zone 
      FROM complaints c
      JOIN restaurants r ON c.restaurant_id = r.id
      WHERE r.zone = ?
    `, [zone]);
    
    // Calculate sentiment stats
    const sentimentService = new SentimentService();
    const sentimentStats = sentimentService.calculateStats(complaints);

    const stats = {
      totalInspectors: inspectors.length,
      approvedRestaurants: restaurants.filter(r => r.status === 'approved').length,
      pendingRestaurants: restaurants.filter(r => r.status === 'pending').length,
      totalReports: reports.length,
      totalComplaints: complaints.length,
      criticalComplaints: complaints.filter(c => c.urgency === 'critical').length,
      sentimentStats
    };

    res.render('adminDashboard', {
      adminName,
      zone,
      stats,
      success // Pass success to template
    });

  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.status(500).render('error', { message: 'Failed to load dashboard data.' });
  }
});

router.get('/admin/inspectors',async (req, res)=>{
   const zone = req.session.zone;
   if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  if (!zone) {
    return res.status(403).render('error', { message: 'Zone not assigned or session expired.' });
  }
  const [inspectors] = await db.query('Select * from inspectors where zone=?',[zone])
  res.render('manageInspectors',{inspectors,zone})
})

router.get('/admin/inspectors/add', (req, res) => {
  const zone = req.session.zone;
  const success = req.query.success;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  res.render('addInspector', { zone, success });
});

router.get('/admin/inspectors/edit/:id', async (req, res) => {
  const inspectorId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [results] = await db.query('SELECT * FROM inspectors WHERE id = ?', [inspectorId]);
    if (results.length === 0) {
      return res.status(404).render('error', { message: 'Inspector not found' });
    }
    res.render('editInspector', { inspector: results[0] });
  } catch (err) {
    console.error('Error fetching inspector:', err);
    res.status(500).render('error', { message: 'Failed to load inspector data.' });
  }
});

router.get('/admin/restaurants', async (req, res) => {
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  const [restaurants] = await db.query(
    'SELECT * FROM restaurants WHERE zone = ?', [zone]
  );

  const pendingRestaurants = restaurants.filter(r => r.status === 'pending');
  const approvedRestaurants = restaurants.filter(r => r.status === 'approved');
  const deletedRestaurants = restaurants.filter(r => r.status === 'rejected');

  res.render('manageRestaurants', {
    pendingRestaurants,
    approvedRestaurants,
    deletedRestaurants,
    adminName: req.session.adminName,
    zone
  });
});

// Route: GET /admin/restaurants/edit/:id
router.get('/admin/restaurants/edit/:id', async (req, res) => {
  const restaurantId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [rows] = await db.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);

    if (rows.length === 0) {
      return res.status(404).render('error', { message: 'Restaurant not found' });
    }

    const restaurant = rows[0];
    res.render('editRestaurant', { restaurant });
  } catch (err) {
    console.error('Error loading restaurant for editing:', err);
    res.status(500).render('error', { message: 'Failed to load restaurant details.' });
  }
});

router.get('/admin/restaurants', async (req, res) => {
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  const [restaurants] = await db.query('SELECT * FROM restaurants WHERE zone = ?', [zone]);
  const pendingRestaurants = restaurants.filter(r => r.status === 'pending');
  const approvedRestaurants = restaurants.filter(r => r.status === 'approved');

  res.render('manageRestaurants', {
    pendingRestaurants,
    approvedRestaurants
  });
});

// router.get('/admin/reports', async (req, res) => {
//   const zone = req.session.zone;

//   try {
//     const [inspections] = await db.query(`
//       SELECT 
//         i.id AS inspection_id,
//         r.name AS restaurant_name,
//         r.license_number,
//         r.region,
//         ins.name AS inspector_name,
//         i.inspection_date,
//         ir.id AS report_id,
//         ir.status AS report_status,
//         ir.submitted_at
//       FROM inspections i
//       JOIN inspection_reports ir ON ir.inspection_id = i.id
//       JOIN restaurants r ON i.restaurant_id = r.id
//       JOIN inspectors ins ON i.inspector_id = ins.id
//       WHERE i.status = 'Completed'
//       AND r.zone = ?
//       ORDER BY ir.submitted_at DESC
//     `, [zone]);

//     res.render('reviewReports', { inspections, zone });

//   } catch (err) {
//     console.error('Error loading reports:', err);
//     res.status(500).render('error', { message: 'Failed to load inspection reports.' });
//   }
// });
router.get('/admin/reports', async (req, res) => {
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [all] = await db.query(`
      SELECT 
        ir.id AS report_id,
        ir.status,
        ir.hygiene_score,
        ir.submitted_at,
        r.name AS restaurant_name,
        r.license_number,
        ins.name AS inspector_name
      FROM inspection_reports ir
      JOIN inspections i ON ir.inspection_id = i.id
      JOIN restaurants r ON ir.restaurant_id = r.id
      JOIN inspectors ins ON ir.inspector_id = ins.id
      WHERE r.zone = ?
      ORDER BY ir.submitted_at DESC
    `, [zone]);

    const pending = all.filter(r => r.status === 'pending');
    const approved = all.filter(r => r.status === 'approved');
    const rejected = all.filter(r => r.status === 'rejected');

    res.render('reviewReports', {
      all,
      pending,
      approved,
      rejected
    });

  } catch (err) {
    console.error('Error loading reports:', err);
    res.status(500).render('error', { message: 'Failed to load inspection reports.' });
  }
});

router.get('/admin/reports/:id', async (req, res) => {
  const reportId = req.params.id;

  try {
    const [[report]] = await db.query(`
  SELECT ir.*, r.name AS restaurant_name, r.license_number, r.phone, r.email, r.address,
         r.zone AS restaurant_zone, r.region AS restaurant_region,
         i.name AS inspector_name,
         a.name AS admin_name
  FROM inspection_reports ir
  JOIN restaurants r ON ir.restaurant_id = r.id
  JOIN inspectors i ON ir.inspector_id = i.id
  LEFT JOIN admins a ON ir.approved_by = a.id
  WHERE ir.id = ?
`, [reportId]);


    if (!report) {
      return res.status(404).render('error', { message: 'Report not found' });
    }

    // Parse JSON
    const reportData = typeof report.report_json === 'string' ? JSON.parse(report.report_json) : report.report_json;
    let imageUrls = [];

    if (Array.isArray(report.image_paths)) {
      imageUrls = report.image_paths;
    } else if (typeof report.image_paths === 'string') {
      try {
        imageUrls = JSON.parse(report.image_paths);
      } catch (err) {
        console.error('Failed to parse image paths', err.message);
      }
    }

    const hygieneScore = report.hygiene_score;
    const scoreColor = hygieneScore >= 4 ? 'green' : hygieneScore >= 3 ? 'orange' : 'red';

    res.render('adminViewReport', {
      report: {
        ...report,
        report_data: reportData,
        image_urls: imageUrls
      },
      restaurant: {
        name: report.restaurant_name,
        license_number: report.license_number,
        phone: report.phone,
        email: report.email,
        address: report.address,
        region: report.restaurant_region,
        zone: report.restaurant_zone
      },
      inspector: {
        name: report.inspector_name
      },
      adminName: report.admin_name,
      checklistSchema,
      sectionLabels,
      hygieneScore,
      scoreColor
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Server Error' });
  }
});



router.get('/admin/reports/:id/pdf', async (req, res) => {
  const reportId = req.params.id;

  try {
    const [[report]] = await db.query(`
  SELECT ir.*, r.name AS restaurant_name, r.license_number, r.phone, r.email, r.address,
         r.zone AS restaurant_zone, r.region AS restaurant_region,
         i.name AS inspector_name,
         a.name AS admin_name
  FROM inspection_reports ir
  JOIN restaurants r ON ir.restaurant_id = r.id
  JOIN inspectors i ON ir.inspector_id = i.id
  LEFT JOIN admins a ON ir.approved_by = a.id
  WHERE ir.id = ?
`, [reportId]);


    if (!report) return res.status(404).render('error', { message: 'Report not found' });

    // Parse JSON fields
    let reportData = {};
    try {
      reportData = typeof report.report_json === 'string' ? JSON.parse(report.report_json) : report.report_json;
    } catch (e) {
      console.error('Failed to parse report_json:', e);
      reportData = {};
    }

    let imageUrls = [];
    if (Array.isArray(report.image_paths)) {
      imageUrls = report.image_paths;
    } else if (typeof report.image_paths === 'string') {
      try {
        imageUrls = JSON.parse(report.image_paths);
      } catch (err) {
        console.error('Failed to parse image_paths:', err.message);
      }
    }

    const pdfBuffer = await PDFService.generateInspectionReportPDF({
  report: {
    ...report,
    report_data: reportData,
    image_urls: imageUrls
  },
  restaurant: {
    name: report.restaurant_name,
    license_number: report.license_number,
    phone: report.phone,
    email: report.email,
    address: report.address,
    zone: report.restaurant_zone,
    region: report.restaurant_region
  },
  inspector: {
    name: report.inspector_name
  },
  admin: {
    name: report.admin_name || null
  }
});


    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=FSSAI-Report-${reportId}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Failed to generate PDF:', err);
    res.status(500).render('error', { message: 'Failed to generate PDF report' });
  }
});



router.get('/admin/inspections/schedule', async (req, res) => {
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [restaurants] = await db.query(`
      SELECT id, name, license_number, region, last_inspection_date 
      FROM restaurants 
      WHERE zone = ? AND status = 'approved'
    `, [zone]);

    // Assign priority
    restaurants.forEach(r => {
      if (!r.last_inspection_date) {
        r.priority = 'High';
      } else {
        const daysSince = Math.floor((Date.now() - new Date(r.last_inspection_date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 90) r.priority = 'High';
        else if (daysSince > 60) r.priority = 'Medium';
        else r.priority = 'Low';
      }
    });

    const [inspectors] = await db.query(`
      SELECT id, name, region FROM inspectors WHERE zone = ?
    `, [zone]);

    const [scheduled] = await db.query(`
      SELECT 
        i.id, 
        r.name AS restaurant_name, 
        ins.name AS inspector_name, 
        i.inspection_date AS scheduled_date, 
        i.status 
      FROM inspections i
      JOIN restaurants r ON i.restaurant_id = r.id
      JOIN inspectors ins ON i.inspector_id = ins.id
      WHERE r.zone = ? AND i.status ='Scheduled'
      ORDER BY i.inspection_date DESC
    `, [zone]);

    // ✅ Calculate today's date in yyyy-mm-dd format
    const today = new Date().toISOString().split('T')[0];

    res.render('scheduleInspections', {
      restaurants,
      inspectors,
      scheduled,
      today,  // <-- ✅ pass this to the template
      zone
    });

  } catch (err) {
    console.error('Error loading inspections:', err);
    res.status(500).render('error', { message: 'Failed to load inspection scheduling page.' });
  }
});

//POST
router.post('/adminLogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect('/adminLogin?error=Email and password are required');
  }

  try {
    const [results] = await db.query("SELECT * FROM admins WHERE email = ?", [email]);

    if (results.length === 0 || results[0].password !== password) {
      return res.redirect('/adminLogin?error=Invalid credentials');
    }

    req.session.zone = results[0].zone;
    req.session.adminName = results[0].name;
    req.session.adminId=results[0].id;
    res.redirect('/admin/dashboard?success=1'); // This is correct
  } catch (err) {
    console.error("Database error:", err);
    res.redirect('/adminLogin?error=Internal server error');
  }
});

router.post('/admin/inspectors/add', async (req, res) => {
  const { name, email, phone, password, region } = req.body;
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query(`
      INSERT INTO inspectors (name, email, phone, password, region, zone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, email, phone, password, region, zone]);

    res.redirect('/admin/inspectors/add?success=1');
  } catch (err) {
    console.error('Error adding inspector:', err);
    res.status(500).render('error', { message: 'Failed to add inspector.' });
  }
});

router.post('/admin/inspectors/delete/:id', async (req, res) => {
  const inspectorId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query('DELETE FROM inspectors WHERE id = ?', [inspectorId]);
    res.redirect('/admin/inspectors');
  } catch (err) {
    console.error('Error deleting inspector:', err);
    res.status(500).render('error', { message: 'Failed to delete inspector.' });
  }
});

router.post('/admin/inspectors/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, region } = req.body;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query(
      'UPDATE inspectors SET name = ?, email = ?, phone = ?, region = ? WHERE id = ?',
      [name, email, phone, region, id]
    );
    res.redirect('/admin/inspectors');
  } catch (error) {
    console.error('Error updating inspector:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/admin/restaurants/edit/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  const { name, license_number, contact_person, phone, email, address, region, status } = req.body;
  await db.query(
    'UPDATE restaurants SET name=?, license_number=?, contact_person=?, phone=?, email=?, address=?, region=?, status=? WHERE id=?',
    [name, license_number, contact_person, phone, email, address, region, status, req.params.id]
  );
  res.redirect('/admin/restaurants');
});

router.post('/admin/restaurants/delete/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query('UPDATE restaurants SET status = "rejected" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/restaurants');
  } catch (err) {
    console.error('Soft delete failed:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/admin/restaurants/restore/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query('UPDATE restaurants SET status = "approved" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/restaurants');
  } catch (err) {
    console.error('Restore failed:', err);
    res.status(500).send('Internal Server Error');
  }
});





router.get('/admin/inspections',async (req, res)=>{

  res.render('manageInspection')
})

// Schedule a new inspection for a restaurant
router.get('/admin/restaurants/schedule/:id', async (req, res) => {
  const restaurantId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    // First, fetch restaurant details to find:
    // 1️⃣ Inspector (created_by) 
    // 2️⃣ Last Inspection Date
    const [rows] = await db.query(`
      SELECT created_by, last_inspection_date FROM restaurants WHERE id = ?
    `, [restaurantId]);

    if (rows.length === 0) {
      return res.status(404).send('Restaurant not found');
    }
    const inspectorId = rows[0].created_by;
    const lastInspection = rows[0].last_inspection_date;

    // Next, insert into inspections table with the fetched info
    await db.query(`
      INSERT INTO inspections (restaurant_id, inspector_id, status, last_inspection)
      VALUES (?, ?, ?, ?)
    `, [restaurantId, inspectorId, 'Scheduled', lastInspection]);

    res.redirect('/admin/restaurants/view?success=1'); // Redirect back to restaurants view or wherever you want
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



router.get('/admin/restaurants/view', async (req, res) => {
  const zone = req.session.zone;
  const { success } = req.query;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [approvedRestaurants] = await db.query(`
      SELECT * FROM restaurants r
      WHERE r.status = 'approved'
        AND r.zone = ?
        AND r.id NOT IN (
          SELECT i.restaurant_id FROM inspections i WHERE i.status IN ('Scheduled', 'Completed')
        )
    `, [zone]);

    res.render('restaurantsView', { approvedRestaurants ,success  });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/admin/reports/approve/:id', async (req, res) => {
  const reportId = req.params.id;
  const adminId = req.session.adminId;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  try {
    // Get restaurant_id, hygiene_score, inspection_id
    const [[report]] = await db.query(`
      SELECT ir.restaurant_id, ir.hygiene_score, i.last_inspection
      FROM inspection_reports ir
      JOIN inspections i ON ir.inspection_id = i.id
      WHERE ir.id = ?
    `, [reportId]);

    if (!report) {
      return res.status(404).render('error', { message: 'Report not found.' });
    }

    // Update inspection_reports status
    await db.query(`
  UPDATE inspection_reports 
  SET status = 'approved', approved_by = ? 
  WHERE id = ?
`, [adminId, reportId]);


    // Update restaurants table with new score & date
    await db.query(`
      UPDATE restaurants 
      SET hygiene_score = ?, last_inspection_date = ?, insp_rep_id = ?
      WHERE id = ?
    `, [report.hygiene_score, report.last_inspection, reportId, report.restaurant_id]);

    res.redirect('/admin/reports');
  } catch (err) {
    console.error('Error approving report:', err);
    res.status(500).render('error', { message: 'Failed to approve report.' });
  }
});

router.post('/admin/reports/reject/:id', async (req, res) => {
  const reportId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query(`UPDATE inspection_reports SET status = 'rejected' WHERE id = ?`, [reportId]);
    res.redirect('/admin/reports');
  } catch (err) {
    console.error('Error rejecting report:', err);
    res.status(500).render('error', { message: 'Failed to reject report.' });
  }
});


router.post('/admin/inspections/schedule', async (req, res) => {
  const { restaurant_id, inspector_id, inspection_date } = req.body;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query(`
      INSERT INTO inspections (restaurant_id, inspector_id, inspection_date, status)
      VALUES (?, ?, ?, 'Scheduled')
    `, [restaurant_id, inspector_id, inspection_date]);

    res.redirect('/admin/inspections/schedule');
  } catch (err) {
    console.error('Error scheduling inspection:', err);
    res.status(500).render('error', { message: 'Failed to schedule inspection.' });
  }
});

router.post('/admin/inspections/delete/:id', async (req, res) => {
  const inspectionId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query('DELETE FROM inspections WHERE id = ?', [inspectionId]);
    res.redirect('/admin/inspections/schedule');
  } catch (err) {
    console.error('Error deleting inspection:', err);
    res.status(500).send('Internal Server Error');
  }
});
router.post('/admin/restaurants/approve/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  await db.query('UPDATE restaurants SET status = "approved" WHERE id = ?', [req.params.id]);
  res.redirect('/admin/restaurants');
});


router.post('/admin/restaurants/reject/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  await db.query('UPDATE restaurants SET status = "rejected" WHERE id = ?', [req.params.id]);
  res.redirect('/admin/restaurants');
});
router.get('/admin/restaurants/approvals',async (req, res)=>{
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  const [pendingRestaurants] = await db.query('SELECT * FROM restaurants where status=?',['pending']);
  res.render('restaurantsApproval',{pendingRestaurants})
})

// Complaints Management with Sentiment Analysis
router.get('/admin/complaints', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
    return res.redirect('/adminLogin');
  }

  const zone = req.session.zone;
  const filterUrgency = req.query.urgency || 'all';
  const filterSentiment = req.query.sentiment || 'all';

  try {
    // Get complaints for the zone
    let query = `
      SELECT c.*, r.name as restaurant_name, r.zone, u.name as user_name
      FROM complaints c
      JOIN restaurants r ON c.restaurant_id = r.id
      LEFT JOIN users u ON c.user_id = u.email
      WHERE r.zone = ?
    `;
    
    const params = [zone];

    // Add filters
    if (filterUrgency !== 'all') {
      query += ` AND c.urgency = ?`;
      params.push(filterUrgency);
    }
    
    if (filterSentiment !== 'all') {
      query += ` AND c.sentiment = ?`;
      params.push(filterSentiment);
    }

    query += ` ORDER BY 
      CASE c.urgency 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      c.created_at DESC`;

    const [complaints] = await db.query(query, params);

    // Parse AI analysis JSON (handle both string and object)
    const complaintsWithAnalysis = complaints.map(c => ({
      ...c,
      ai_analysis: c.ai_analysis 
        ? (typeof c.ai_analysis === 'string' ? JSON.parse(c.ai_analysis) : c.ai_analysis) 
        : null,
      images: c.images 
        ? (typeof c.images === 'string' ? JSON.parse(c.images) : c.images) 
        : []
    }));

    // Calculate statistics
    const sentimentService = new SentimentService();
    const sentimentStats = sentimentService.calculateStats(complaints);

    res.render('admin/complaints', {
      complaints: complaintsWithAnalysis,
      sentimentStats,
      adminName: req.session.adminName,
      zone,
      filterUrgency,
      filterSentiment
    });

  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).render('error', { message: 'Failed to load complaints.' });
  }
});

// Update complaint status
router.post('/admin/complaints/:id/status', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
    return res.redirect('/adminLogin');
  }

  const complaintId = req.params.id;
  const { status } = req.body;

  try {
    await db.query(
      'UPDATE complaints SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, complaintId]
    );
    res.redirect('/admin/complaints');
  } catch (err) {
    console.error('Error updating complaint status:', err);
    res.status(500).send('Error updating complaint status');
  }
});

// ==================== ANOMALY DETECTION ROUTES ====================

// Anomaly Detection Dashboard Page
router.get('/admin/anomalies', async (req, res) => {
  const adminName = req.session.adminName;
  const zone = req.session.zone;
  
  if (!adminName || !zone) {
    return res.redirect('/adminLogin');
  }

  try {
    res.render('admin/anomalies', {
      adminName,
      zone
    });
  } catch (err) {
    console.error('Error loading anomaly detection page:', err);
    res.status(500).render('error', { message: 'Failed to load anomaly detection page.' });
  }
});

// API: Get Anomaly Analysis
router.get('/admin/api/anomalies/analyze', async (req, res) => {
  const zone = req.session.zone;
  
  if (!req.session.adminName || !zone) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch all relevant data for the zone
    const [reports] = await db.query(`
      SELECT ir.*, r.name as restaurant_name, r.zone, i.name as inspector_name
      FROM inspection_reports ir
      JOIN restaurants r ON ir.restaurant_id = r.id
      JOIN inspectors i ON ir.inspector_id = i.id
      WHERE r.zone = ? AND ir.status = 'approved'
      ORDER BY ir.submitted_at DESC
    `, [zone]);

    const [restaurants] = await db.query('SELECT * FROM restaurants WHERE zone = ?', [zone]);
    const [inspectors] = await db.query('SELECT * FROM inspectors WHERE zone = ?', [zone]);

    if (reports.length === 0) {
      return res.json({
        success: true,
        message: 'No inspection reports available for analysis',
        data: {
          inspector_anomalies: [],
          restaurant_anomalies: [],
          regional_trends: [],
          urgent_actions: [],
          overall_health: {
            score: 0,
            status: 'no_data',
            summary: 'No inspection data available'
          }
        }
      });
    }

    // Perform AI-powered anomaly detection
    const anomalyService = new AnomalyService();
    const analysis = await anomalyService.analyzeInspectionAnomalies(reports, restaurants, inspectors);

    // Log the analysis
    await db.query(
      'INSERT INTO anomaly_logs (analysis_type, zone, analysis_data, anomalies_found) VALUES (?, ?, ?, ?)',
      [
        'comprehensive',
        zone,
        JSON.stringify(analysis),
        (analysis.inspector_anomalies?.length || 0) + (analysis.restaurant_anomalies?.length || 0)
      ]
    );

    res.json({
      success: true,
      data: analysis
    });

  } catch (err) {
    console.error('Error analyzing anomalies:', err);
    res.status(500).json({ 
      error: 'Failed to analyze anomalies',
      details: err.message 
    });
  }
});

// API: Get Inspector Behavior Analysis
router.get('/admin/api/anomalies/inspectors', async (req, res) => {
  const zone = req.session.zone;
  
  if (!req.session.adminName || !zone) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [reports] = await db.query(`
      SELECT ir.*, i.name as inspector_name, i.zone as inspector_zone
      FROM inspection_reports ir
      JOIN inspectors i ON ir.inspector_id = i.id
      WHERE i.zone = ? AND ir.status = 'approved'
    `, [zone]);

    const [inspectors] = await db.query('SELECT * FROM inspectors WHERE zone = ?', [zone]);

    const anomalyService = new AnomalyService();
    const inspectorAnomalies = anomalyService.analyzeInspectorBehavior(reports, inspectors);

    res.json({
      success: true,
      data: inspectorAnomalies
    });

  } catch (err) {
    console.error('Error analyzing inspector behavior:', err);
    res.status(500).json({ error: 'Failed to analyze inspector behavior' });
  }
});

// API: Get Restaurant Risk Patterns
router.get('/admin/api/anomalies/restaurants', async (req, res) => {
  const zone = req.session.zone;
  
  if (!req.session.adminName || !zone) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [reports] = await db.query(`
      SELECT ir.*, r.name as restaurant_name, r.zone
      FROM inspection_reports ir
      JOIN restaurants r ON ir.restaurant_id = r.id
      WHERE r.zone = ? AND ir.status = 'approved'
      ORDER BY ir.submitted_at DESC
    `, [zone]);

    const [restaurants] = await db.query('SELECT * FROM restaurants WHERE zone = ?', [zone]);

    const anomalyService = new AnomalyService();
    const patterns = anomalyService.detectPatterns(reports, restaurants);

    res.json({
      success: true,
      data: patterns
    });

  } catch (err) {
    console.error('Error analyzing restaurant patterns:', err);
    res.status(500).json({ error: 'Failed to analyze restaurant patterns' });
  }
});

// API: Mark Report for Re-inspection
router.post('/admin/api/anomalies/mark-reinspection/:reportId', async (req, res) => {
  const zone = req.session.zone;
  const reportId = req.params.reportId;
  
  if (!req.session.adminName || !zone) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db.query(
      'UPDATE inspection_reports SET requires_reinspection = TRUE, anomaly_analyzed_at = NOW() WHERE id = ?',
      [reportId]
    );

    res.json({
      success: true,
      message: 'Report marked for re-inspection'
    });

  } catch (err) {
    console.error('Error marking report for re-inspection:', err);
    res.status(500).json({ error: 'Failed to mark report' });
  }
});

// API: Get Anomaly Statistics
router.get('/admin/api/anomalies/stats', async (req, res) => {
  const zone = req.session.zone;
  
  if (!req.session.adminName || !zone) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get reports requiring re-inspection
    const [reinspectionNeeded] = await db.query(`
      SELECT COUNT(*) as count
      FROM inspection_reports ir
      JOIN restaurants r ON ir.restaurant_id = r.id
      WHERE r.zone = ? AND ir.requires_reinspection = TRUE
    `, [zone]);

    // Get recent anomaly logs
    const [recentAnalyses] = await db.query(`
      SELECT * FROM anomaly_logs
      WHERE zone = ?
      ORDER BY analyzed_at DESC
      LIMIT 5
    `, [zone]);

    // Get distribution of anomaly severity
    const [severityDist] = await db.query(`
      SELECT anomaly_severity, COUNT(*) as count
      FROM inspection_reports ir
      JOIN restaurants r ON ir.restaurant_id = r.id
      WHERE r.zone = ? AND ir.anomaly_detected = TRUE
      GROUP BY anomaly_severity
    `, [zone]);

    res.json({
      success: true,
      data: {
        reinspection_needed: reinspectionNeeded[0].count,
        recent_analyses: recentAnalyses,
        severity_distribution: severityDist
      }
    });

  } catch (err) {
    console.error('Error fetching anomaly stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});



module.exports = router;