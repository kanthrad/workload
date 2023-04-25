import './css/style.css'

import { useEffect, useState } from "react";

import { collection, getDocs } from "firebase/firestore";
import { db } from '../../firebase';

import { Calendar } from 'antd';
import dayjs from 'dayjs';

function CalendarWithContent() {
  const user = 'dk';
  const date = new Date();
  const actualMonth = date.getMonth() + 1;
  const actualYear = date.getFullYear();
  const actualDate = date.getDate();
  const maxWorkingHoursPerDay_AvailableForOneTask = 6;
  /** getMonth() return @type Number, starts from 0 (0 – 11) */
  const [currentMonth, setCurrentMonth] = useState(actualMonth);
  /** getFullYear() return @type Number */
  const [currentYear, setCurrentYear] = useState(date.getFullYear(actualYear));

  const [monthTasks, setMonthTasks] = useState([]);
  const [prevMonthTasks, setPrevMonthTasks] = useState([]);
  const [nextMonthTasks, setNextMonthTasks] = useState([]);

  useEffect(() => {
    /**
     * user @type String
     * currentMonth @type Number | integer (converted from String on setMonthTasks)
     * currentYear @type Number | integer (converted from String on setcurrentYear)
     */

    /** get tasks for prev month */
    fetchPost(user, (
      (currentMonth == 1) ? currentYear - 1 : currentYear),
      ((currentMonth == 1) ? 12 : currentMonth - 1)
    ).then((tasks) => setPrevMonthTasks(tasks));

    /** get tasks for current month */
    fetchPost(user, currentYear, currentMonth).then((tasks) => setMonthTasks(tasks));

    /** get tasks for next month */
    fetchPost(user, (
      (currentMonth == 12) ? currentYear + 1 : currentYear),
      ((currentMonth == 12) ? 1 : currentMonth + 1)
    ).then((tasks) => setNextMonthTasks(tasks));

    // TODO: return () => {stop prev fetch if called another fetch}
  }, [currentMonth, currentYear]);

  const fetchPost = async (user, year, month) => {
    let collectionDate = year + '-' + month;
    let collectionName = 'tasks-' + user + '-' + collectionDate;
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      /* TODO: add timing type */
      if (true) { /* timing type is X */
        /**
         * handle a tasks of the next month start
         * on next month tasks loop add hours to monthTasks array, when hours in next month task requires more days then available. Eg.
         * when (task hours = 11) and (deadline = 01.next-month)
         * then time will spread like this: (01.next-month: maxHours) and (31.current-month: restHours)
         * 1. define prev (for next month tasks loop) month, year
         * 2. during dates loop catch if current date is 01
         * 3. push hours to monthTasks array with reverse order of date
         */
        let prevYearForCurrentCollection = (month == 1) ? year - 1 : year;
        let prevMonthForCurrentCollection = (month == 1) ? 12 : month - 1;
        let endDateOfPrevMonthForCurrentCollection = dayjs(prevYearForCurrentCollection + '-' + prevMonthForCurrentCollection).endOf('month').date();
        return querySnapshot.docs.map((task, index) => {
          let data = task.data();
          /**
           * get an array of dates related to a task | [27, 26, 25]
           * 1. create array-1 with length equal to: Math.ceil(task-hour / max-work-hours-in-day) | 23/maxWorkingHoursPerDay_AvailableForOneTask = 4
           * 2. create array-2 from array-1 and set every value equal to: (deadline-date - element-order) | 27-0 or 27-1
           * 3. handle weekend
           **/
          let j = -1;
          // let i = -1;
          let dates = [...Array(Math.ceil(data.hours / maxWorkingHoursPerDay_AvailableForOneTask))].map((_, index) => {
            /* skip the weekend | sunday - 0 */
            j++;
            if (dayjs(collectionDate + '-' + (data.date - j)).day() == 0) {
              j = j + 2;
            }
            /* handle a tasks of the beginning of the next month */
            if ((data.date - j) < 1) {
              let datePrev = endDateOfPrevMonthForCurrentCollection - Math.abs(data.date - j);
              let hoursPrev = ((data.hours - maxWorkingHoursPerDay_AvailableForOneTask * index) <= maxWorkingHoursPerDay_AvailableForOneTask) ? data.hours - maxWorkingHoursPerDay_AvailableForOneTask * index : maxWorkingHoursPerDay_AvailableForOneTask;
              let dayPrev = dayjs(prevYearForCurrentCollection + '-' + prevMonthForCurrentCollection + '-' + (datePrev)).day();
              let dateHourPrev = [];
              dateHourPrev[Number(datePrev)] = hoursPrev;
              if (dayPrev > 0 && dayPrev < maxWorkingHoursPerDay_AvailableForOneTask) {
                /**
                 * !! if React.StrictMode mode is ON - setState will fire twise
                 */
                if (month == currentMonth) {
                  setPrevMonthTasks((tasks) => [...tasks, { project: data.project, date: datePrev, id: (data.project + '-' + data.date + '-' + index), hours: hoursPrev, dates: [datePrev], dateHour: dateHourPrev }]);
                } else {
                  setMonthTasks((tasks) => [...tasks, { project: data.project, date: datePrev, id: (data.project + '-' + data.date + '-' + index), hours: hoursPrev, dates: [datePrev], dateHour: dateHourPrev }]);
                }
              }
            }
            return data.date - j;
          });
          /**
           * get an array of hours related to each of the dates | [27:maxHours, 26:maxHours, 25:1]
           **/
          let dateHour = [];
          let hours = data.hours;
          for (let j = 0; j < dates.length; j++) {
            dateHour[dates[j]] = Math.min(hours, maxWorkingHoursPerDay_AvailableForOneTask);
            hours = hours - maxWorkingHoursPerDay_AvailableForOneTask;
          }
          return {
            ...data,
            id: (data.project + '-' + data.date + '-' + index),
            dates: dates,
            dateHour: dateHour
          }
        });
      } else if (false) { /* timing type is Y */ }
    } catch (e) {
      console.error("Error getting docs", e);
    }
  }

  const dateCellRender = (value) => {
    /**
     * date() return @type Number
     */
    let date = value.date();
    /**
     * month() return @type Number, starts from 0 (0 – 11)
     */
    let month = value.month() + 1;
    let tasks = (month == currentMonth) ? monthTasks : (
      (month < currentMonth) ? prevMonthTasks : nextMonthTasks
    );

    if (tasks.findIndex(task => task.dates.includes(date)) != -1) {
      let dayTasks = tasks.filter(task => task.dates.includes(date));
      /**
       * add current date to KEY because for a task.dates the task.id is always the same
       */
      return (
        <ul className={(dayjs(value.year() + '-' + month + '-' + date).isBefore(dayjs(actualYear + '-' + actualMonth + '-' + actualDate))) ? 'tasks tasks--past-month' : 'tasks'}>
          {dayTasks.map((task, index) => (
            <li
              key={task.id + '-' + date + '-' + index}
              data-title={Math.ceil(dayTasks[index].dateHour[date] * 100 / 7) + '%'}
              className={'task task-' + String(dayTasks[index].dateHour[date]).replace('.', '_')}
            >
            </li>
          ))
          }
        </ul>
      );
    }
  }

  const onPanelChange = (value) => {
    /**
     * format() return @type String
     */
    setCurrentMonth(Number(value.format('M')));
    setCurrentYear(Number(value.format('YYYY')));
  };

  return (
    <Calendar
      dateCellRender={dateCellRender}
      onPanelChange={onPanelChange}
      validRange={[dayjs('2023-01-01'), dayjs('2024-12-31')]}
    />
  );
}
export default CalendarWithContent;