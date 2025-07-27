const kolTierService = require('./kolTierService');

/**
 * Scheduler Service
 * Manages scheduled tasks for the application
 * Note: This is a basic implementation. For production, consider using node-cron or similar package.
 */
const schedulerService = {
  intervals: new Map(),

  /**
   * Initialize all scheduled tasks
   */
  initializeScheduledTasks: () => {
    console.log('Initializing scheduled tasks...');
    
    // Schedule KOL tier recalculation to run daily (every 24 hours)
    const dailyInterval = setInterval(async () => {
      console.log('Running scheduled KOL tier recalculation...');
      try {
        await kolTierService.scheduledTierRecalculation();
      } catch (error) {
        console.error('Error in scheduled KOL tier recalculation:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    schedulerService.intervals.set('dailyTierRecalculation', dailyInterval);

    // Schedule KOL tier recalculation to run every 6 hours (for more frequent updates)
    const frequentInterval = setInterval(async () => {
      console.log('Running frequent KOL tier check...');
      try {
        // Only update KOLs that might be eligible for tier upgrade
        const eligibleResult = await kolTierService.getKolsEligibleForUpgrade();
        if (eligibleResult.errCode === 0 && eligibleResult.data.eligibleCount > 0) {
          console.log(`Found ${eligibleResult.data.eligibleCount} KOLs eligible for tier upgrade`);
          
          // Update only eligible KOLs
          for (const kol of eligibleResult.data.kols) {
            await kolTierService.updateKolTier(kol.id, true);
          }
        }
      } catch (error) {
        console.error('Error in frequent KOL tier check:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

    schedulerService.intervals.set('frequentTierCheck', frequentInterval);

    console.log('Scheduled tasks initialized successfully');
    console.log('Note: For production use, consider implementing proper cron scheduling with node-cron package');
  },

  /**
   * Stop all scheduled tasks
   */
  stopScheduledTasks: () => {
    schedulerService.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`Stopped scheduled task: ${name}`);
    });
    schedulerService.intervals.clear();
    console.log('All scheduled tasks stopped');
  },

  /**
   * Get status of all scheduled tasks
   */
  getScheduledTasksStatus: () => {
    return {
      totalTasks: schedulerService.intervals.size,
      tasks: Array.from(schedulerService.intervals.keys()).map(name => ({
        name,
        running: true,
        type: 'interval'
      }))
    };
  },

  /**
   * Manually trigger KOL tier recalculation
   */
  triggerKolTierRecalculation: async () => {
    try {
      console.log('Manually triggering KOL tier recalculation...');
      const result = await kolTierService.scheduledTierRecalculation();
      return result;
    } catch (error) {
      console.error('Error in manual KOL tier recalculation:', error);
      return {
        errCode: -1,
        errMessage: 'Error in manual recalculation'
      };
    }
  },

  /**
   * Add a custom scheduled task
   * @param {string} name - Task name
   * @param {Function} task - Task function to execute
   * @param {number} intervalMs - Interval in milliseconds
   */
  addScheduledTask: (name, task, intervalMs) => {
    if (schedulerService.intervals.has(name)) {
      console.warn(`Task ${name} already exists. Stopping existing task.`);
      clearInterval(schedulerService.intervals.get(name));
    }

    const interval = setInterval(async () => {
      try {
        console.log(`Running scheduled task: ${name}`);
        await task();
      } catch (error) {
        console.error(`Error in scheduled task ${name}:`, error);
      }
    }, intervalMs);

    schedulerService.intervals.set(name, interval);
    console.log(`Added scheduled task: ${name} (interval: ${intervalMs}ms)`);
  },

  /**
   * Remove a scheduled task
   * @param {string} name - Task name to remove
   */
  removeScheduledTask: (name) => {
    if (schedulerService.intervals.has(name)) {
      clearInterval(schedulerService.intervals.get(name));
      schedulerService.intervals.delete(name);
      console.log(`Removed scheduled task: ${name}`);
      return true;
    }
    return false;
  }
};

module.exports = schedulerService;