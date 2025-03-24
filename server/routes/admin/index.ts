import express from 'express';
import accountingCodesRouter from './accounting-codes';
import ageGroupsRouter from './age-groups';
import emailProvidersRouter from './email-providers';
import emailTemplateRoutingsRouter from './email-template-routings';
import eventsRouter from './events';
import membersRouter from './members-router';
import feesRouter from './fees';
import organizationsRouter from './organizations';

export {
  accountingCodesRouter,
  ageGroupsRouter,
  emailProvidersRouter,
  emailTemplateRoutingsRouter,
  eventsRouter,
  membersRouter,
  feesRouter,
  organizationsRouter
};