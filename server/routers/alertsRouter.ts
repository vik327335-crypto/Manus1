import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserAlertConditions,
  getAssetAlertConditions,
  createAlertCondition,
  updateAlertCondition,
  deleteAlertCondition,
  getUserAlertHistory,
  recordAlertTrigger,
} from "../db";

export const alertsRouter = router({
  /**
   * Get all alert conditions for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getUserAlertConditions(ctx.user.id);
  }),

  /**
   * Get alert conditions for a specific asset
   */
  getForAsset: protectedProcedure
    .input((val: any) => ({
      assetId: val.assetId as number,
    }))
    .query(async ({ ctx, input }) => {
      return await getAssetAlertConditions(ctx.user.id, input.assetId);
    }),

  /**
   * Create a new alert condition
   */
  create: protectedProcedure
    .input((val: any) => ({
      assetId: val.assetId as number,
      alertType: val.alertType as string,
      threshold: val.threshold as number | undefined,
      secondaryThreshold: val.secondaryThreshold as number | undefined,
      notifyEmail: val.notifyEmail as boolean | undefined,
      notifyPush: val.notifyPush as boolean | undefined,
      notifyWebsocket: val.notifyWebsocket as boolean | undefined,
      cooldownMinutes: val.cooldownMinutes as number | undefined,
      description: val.description as string | undefined,
    }))
    .mutation(async ({ ctx, input }) => {
      return await createAlertCondition({
        userId: ctx.user.id,
        assetId: input.assetId,
        alertType: input.alertType as any,
        threshold: input.threshold,
        secondaryThreshold: input.secondaryThreshold,
        enabled: 1,
        notifyEmail: input.notifyEmail ? 1 : 0,
        notifyPush: input.notifyPush ? 1 : 0,
        notifyWebsocket: input.notifyWebsocket ? 1 : 0,
        cooldownMinutes: input.cooldownMinutes || 60,
        description: input.description,
      });
    }),

  /**
   * Update an alert condition
   */
  update: protectedProcedure
    .input((val: any) => ({
      id: val.id as number,
      enabled: val.enabled as boolean | undefined,
      threshold: val.threshold as number | undefined,
      notifyEmail: val.notifyEmail as boolean | undefined,
      notifyPush: val.notifyPush as boolean | undefined,
      notifyWebsocket: val.notifyWebsocket as boolean | undefined,
      cooldownMinutes: val.cooldownMinutes as number | undefined,
      description: val.description as string | undefined,
    }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, any> = {};
      if (input.enabled !== undefined) updateData.enabled = input.enabled ? 1 : 0;
      if (input.threshold !== undefined) updateData.threshold = input.threshold;
      if (input.notifyEmail !== undefined) updateData.notifyEmail = input.notifyEmail ? 1 : 0;
      if (input.notifyPush !== undefined) updateData.notifyPush = input.notifyPush ? 1 : 0;
      if (input.notifyWebsocket !== undefined) updateData.notifyWebsocket = input.notifyWebsocket ? 1 : 0;
      if (input.cooldownMinutes !== undefined) updateData.cooldownMinutes = input.cooldownMinutes;
      if (input.description !== undefined) updateData.description = input.description;

      return await updateAlertCondition(input.id, updateData);
    }),

  /**
   * Delete an alert condition
   */
  delete: protectedProcedure
    .input((val: any) => ({
      id: val.id as number,
    }))
    .mutation(async ({ input }) => {
      return await deleteAlertCondition(input.id);
    }),

  /**
   * Get alert history for the current user
   */
  getHistory: protectedProcedure
    .input((val: any) => ({
      limit: val.limit as number | undefined,
    }))
    .query(async ({ ctx, input }) => {
      return await getUserAlertHistory(ctx.user.id, input.limit || 50);
    }),

  /**
   * Record an alert trigger (internal use)
   */
  recordTrigger: protectedProcedure
    .input((val: any) => ({
      conditionId: val.conditionId as number,
      assetId: val.assetId as number,
      alertType: val.alertType as string,
      message: val.message as string,
      triggerValue: val.triggerValue as number,
      thresholdValue: val.thresholdValue as number,
      emailSent: val.emailSent as boolean | undefined,
      pushSent: val.pushSent as boolean | undefined,
      websocketSent: val.websocketSent as boolean | undefined,
    }))
    .mutation(async ({ ctx, input }) => {
      return await recordAlertTrigger({
        conditionId: input.conditionId,
        userId: ctx.user.id,
        assetId: input.assetId,
        alertType: input.alertType,
        message: input.message,
        triggerValue: input.triggerValue,
        thresholdValue: input.thresholdValue,
        emailSent: input.emailSent ? 1 : 0,
        pushSent: input.pushSent ? 1 : 0,
        websocketSent: input.websocketSent ? 1 : 0,
      });
    }),
});
