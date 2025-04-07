import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiUsers } from 'react-icons/fi';
import { COLORS } from '../styles/GlobalStyles';
import { scheduleService } from '../services/apiServices';

const ScheduleContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
`;

const ScheduleHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  color: ${COLORS.primary};
  font-size: 32px;
  margin-bottom: 8px;
`;

const WeekNavigation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const WeekContainer = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const WeekTitle = styled.h3`
  color: ${COLORS.textSecondary};
  font-size: 16px;
  margin-bottom: 8px;
`;

const DayButton = styled.button`
  background-color: ${({ isActive }) => isActive ? COLORS.primary : COLORS.white};
  color: ${({ isActive }) => isActive ? COLORS.white : COLORS.text};
  border: 1px solid ${({ isActive }) => isActive ? COLORS.primary : COLORS.darkGray};
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: ${({ isActive }) => isActive ? '500' : '400'};
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ isActive }) => isActive ? COLORS.primary : COLORS.accent};
    border-color: ${COLORS.primary};
  }
  
  @media (max-width: 768px) {
    min-width: 100px;
    padding: 8px 12px;
  }
`;

const DayName = styled.span`
  font-size: 16px;
  margin-bottom: 4px;
`;

const DayDate = styled.span`
  font-size: 14px;
  color: ${({ isActive }) => isActive ? COLORS.white : COLORS.textSecondary};
`;

const ScheduleGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const ClassCard = styled.div`
  background-color: ${COLORS.white};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 20px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const TimeBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 20px;
  border-right: 1px solid ${COLORS.darkGray};
  
  @media (max-width: 600px) {
    padding-right: 0;
    padding-bottom: 12px;
    border-right: none;
    border-bottom: 1px solid ${COLORS.darkGray};
    flex-direction: row;
    gap: 12px;
    justify-content: center;
  }
`;

const ClassNumber = styled.div`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  margin-bottom: 8px;
`;

const ClassTime = styled.div`
  font-size: 14px;
  color: ${COLORS.textSecondary};
  text-align: center;
`;

const ClassDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ClassTitle = styled.h3`
  color: ${COLORS.text};
  font-size: 18px;
  margin: 0;
`;

const ClassInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.textSecondary};
  font-size: 14px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: ${COLORS.textSecondary};
  background-color: ${COLORS.gray};
  border-radius: 8px;
  font-size: 16px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  &:after {
    content: '';
    width: 32px;
    height: 32px;
    border: 4px solid ${COLORS.light};
    border-top-color: ${COLORS.primary};
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
  }
  
  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [activeWeek, setActiveWeek] = useState('current');
  const [userRole, setUserRole] = useState(null);
  
  // Get days of the current week
  const daysOfWeek = [
    { name: 'Понедельник', value: 'monday' },
    { name: 'Вторник', value: 'tuesday' },
    { name: 'Среда', value: 'wednesday' },
    { name: 'Четверг', value: 'thursday' },
    { name: 'Пятница', value: 'friday' },
    { name: 'Суббота', value: 'saturday' }
  ];
  
  // Calculate dates for current week and next week
  const getDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
    const startDate = new Date(today);
    
    // Adjust to get Monday as the first day
    startDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    // Create array for two weeks (current week + next week)
    const twoWeeksDays = [];
    
    // First week (current)
    daysOfWeek.forEach((day, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      twoWeeksDays.push({
        ...day,
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' }),
        week: 'current'
      });
    });
    
    // Second week (next)
    daysOfWeek.forEach((day, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index + 7); // Add 7 days to get next week
      twoWeeksDays.push({
        ...day,
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' }),
        week: 'next'
      });
    });
    
    return twoWeeksDays;
  };
  
  const days = getDates();
  
  // Effect to load user data when component mounts
  useEffect(() => {
    // Get user role from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || 'STUDENT');
  }, []);
  
  // Effect to fetch schedule when day or week changes
  useEffect(() => {
    if (userRole) {
      fetchSchedule();
    }
  }, [selectedDay, activeWeek, userRole]);
  
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Find the selected day object with date
      const selectedDayObj = days.find(
        day => day.value === selectedDay && day.week === activeWeek
      );
      
      if (!selectedDayObj) {
        throw new Error('День не найден');
      }
      
      // Convert date from "DD.MM" format to "YYYY-MM-DD" for API
      const dateParts = selectedDayObj.date.split('.');
      const currentYear = new Date().getFullYear();
      const selectedDate = `${currentYear}-${dateParts[1]}-${dateParts[0]}`;
      
      // Fetch schedule data for the selected day
      // Use new endpoint that accepts date parameter or fallback to day-of-week
      let data;
      try {
        // First try to fetch by specific date
        data = await scheduleService.getSchedule(`?start_date=${selectedDate}&end_date=${selectedDate}`);
      } catch (error) {
        // Fallback to day-of-week endpoint
        data = await scheduleService.getScheduleByDay(selectedDay);
      }
      
      // Format times to remove milliseconds and sort by start time
      const formattedData = data.map(item => ({
        ...item,
        start_time: item.start_time.substring(0, 5), // HH:MM format
        end_time: item.end_time.substring(0, 5), // HH:MM format
        // Add class number for UI display
        class_number: 0, // This will be assigned after sorting
        // Add room from the backend field
        room: item.room,
        // Add teacher and group info
        teacher: item.teacher_name || 'Преподаватель не указан',
        group_name: item.group_name || 'Группа не указана',
        location: item.room || 'Аудитория не указана'
      }));
      
      // Sort by start time
      formattedData.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      // Assign class numbers after sorting
      formattedData.forEach((item, index) => {
        item.class_number = index + 1;
      });
      
      setSchedule(formattedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Не удалось загрузить расписание. Пожалуйста, попробуйте позже.');
      // For demo, set empty data
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScheduleContainer>
      <ScheduleHeader>
        <Title>Расписание занятий</Title>
      </ScheduleHeader>
      
      <WeekNavigation>
        <div>
          <WeekTitle>Текущая неделя</WeekTitle>
          <WeekContainer>
            {days.filter(day => day.week === 'current').map((day) => (
              <DayButton
                key={day.value + '-current'}
                isActive={selectedDay === day.value && activeWeek === 'current'}
                onClick={() => {
                  setSelectedDay(day.value);
                  setActiveWeek('current');
                }}
              >
                <DayName>{day.name}</DayName>
                <DayDate isActive={selectedDay === day.value && activeWeek === 'current'}>{day.date}</DayDate>
              </DayButton>
            ))}
          </WeekContainer>
        </div>
        
        <div>
          <WeekTitle>Следующая неделя</WeekTitle>
          <WeekContainer>
            {days.filter(day => day.week === 'next').map((day) => (
              <DayButton
                key={day.value + '-next'}
                isActive={selectedDay === day.value && activeWeek === 'next'}
                onClick={() => {
                  setSelectedDay(day.value);
                  setActiveWeek('next');
                }}
              >
                <DayName>{day.name}</DayName>
                <DayDate isActive={selectedDay === day.value && activeWeek === 'next'}>{day.date}</DayDate>
              </DayButton>
            ))}
          </WeekContainer>
        </div>
      </WeekNavigation>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyMessage>{error}</EmptyMessage>
      ) : schedule.length === 0 ? (
        <EmptyMessage>На этот день нет занятий</EmptyMessage>
      ) : (
        <ScheduleGrid>
          {schedule.map((classItem) => (
            <ClassCard key={classItem.id}>
              <TimeBlock>
                <ClassNumber>{classItem.class_number}</ClassNumber>
                <ClassTime>
                  {classItem.start_time}<br/>
                  {classItem.end_time}
                </ClassTime>
              </TimeBlock>
              
              <ClassDetails>
                <ClassTitle>{classItem.subject}</ClassTitle>
                
                <ClassInfo>
                  {/* Teacher info - show for students */}
                  {!(userRole && userRole.toUpperCase() === 'TEACHER') && (
                    <InfoItem>
                      <FiUser />
                      {classItem.teacher}
                    </InfoItem>
                  )}
                  
                  {/* Group info - show for everyone */}
                  <InfoItem>
                    <FiUsers />
                    {classItem.group_name}
                  </InfoItem>
                  
                  {/* Room is shown for everyone */}
                  <InfoItem>
                    <FiMapPin />
                    {classItem.location}
                  </InfoItem>
                  
                  <InfoItem>
                    <FiClock />
                    {classItem.start_time} - {classItem.end_time}
                  </InfoItem>
                </ClassInfo>
              </ClassDetails>
            </ClassCard>
          ))}
        </ScheduleGrid>
      )}
    </ScheduleContainer>
  );
};

export default Schedule; 