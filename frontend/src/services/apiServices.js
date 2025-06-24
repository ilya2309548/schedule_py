import axios from 'axios';

const API_URL = '/api';

// Schedule service
export const scheduleService = {
  // Get schedule
  getSchedule: async (queryParams = '') => {
    try {
      const response = await axios.get(`${API_URL}/schedule${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch schedule' };
    }
  },
  
  // Get schedule by day
  getScheduleByDay: async (day) => {
    try {
      const response = await axios.get(`${API_URL}/schedule/day/${day}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch schedule for day' };
    }
  },
  
  // Get schedule by group
  getScheduleByGroup: async (groupId) => {
    try {
      const response = await axios.get(`${API_URL}/schedule/group/${groupId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch schedule for group' };
    }
  },
  
  // Create schedule entry
  createSchedule: async (scheduleData) => {
    try {
      const response = await axios.post(`${API_URL}/schedule`, scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create schedule entry' };
    }
  },
  
  // Update schedule entry
  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      const response = await axios.put(`${API_URL}/schedule/${scheduleId}`, scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update schedule entry' };
    }
  },
  
  // Delete schedule entry
  deleteSchedule: async (scheduleId) => {
    try {
      await axios.delete(`${API_URL}/schedule/${scheduleId}`);
      return true;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete schedule entry' };
    }
  }
};

// Assignments service
export const assignmentsService = {
  // Локальное хранилище для данных, которые не сохраняются на бэкенде
  _localAssignmentData: {},
  
  // Сохранение данных в локальное хранилище
  _saveLocalData: (assignmentId, data) => {
    try {
      // Получаем текущие локальные данные
      const storedData = localStorage.getItem('assignmentsLocalData');
      const localData = storedData ? JSON.parse(storedData) : {};
      
      // Обновляем данные для конкретного задания
      localData[assignmentId] = {
        ...localData[assignmentId],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // Сохраняем обновленные данные
      localStorage.setItem('assignmentsLocalData', JSON.stringify(localData));
      
      // Обновляем in-memory хранилище
      assignmentsService._localAssignmentData = localData;
      
      console.log(`Локально сохранены данные для задания ID:${assignmentId}`, data);
    } catch (error) {
      console.error('Ошибка при сохранении локальных данных задания:', error);
    }
  },
  
  // Получение данных из локального хранилища
  _getLocalData: (assignmentId) => {
    try {
      // Если данные уже загружены в память, используем их
      if (Object.keys(assignmentsService._localAssignmentData).length > 0) {
        return assignmentsService._localAssignmentData[assignmentId] || null;
      }
      
      // Иначе загружаем из localStorage
      const storedData = localStorage.getItem('assignmentsLocalData');
      if (!storedData) return null;
      
      const localData = JSON.parse(storedData);
      
      // Обновляем in-memory хранилище
      assignmentsService._localAssignmentData = localData;
      
      return localData[assignmentId] || null;
    } catch (error) {
      console.error('Ошибка при получении локальных данных задания:', error);
      return null;
    }
  },
  
  // Загрузка всех локальных данных
  _loadAllLocalData: () => {
    try {
      const storedData = localStorage.getItem('assignmentsLocalData');
      if (!storedData) return {};
      
      const localData = JSON.parse(storedData);
      
      // Обновляем in-memory хранилище
      assignmentsService._localAssignmentData = localData;
      
      return localData;
    } catch (error) {
      console.error('Ошибка при загрузке локальных данных заданий:', error);
      return {};
    }
  },
  
  // Get all assignments
  getAssignments: async () => {
    try {
      const response = await axios.get(`${API_URL}/assignments`);
      const data = response.data || [];
      
      // Загружаем локальные данные
      const localData = assignmentsService._loadAllLocalData();
      
      // Обогащаем данные с сервера локальными данными только если данные отсутствуют на сервере
      const enrichedData = data.map(assignment => {
        const localAssignmentData = localData[assignment.id];
        
        if (localAssignmentData) {
          // Используем локальные данные только если они отсутствуют на сервере
          return {
            ...assignment,
            deadline: assignment.deadline || localAssignmentData.due_date,
            teacher_name: assignment.teacher_name || localAssignmentData.teacher_name
          };
        }
        
        return assignment;
      });
      
      return enrichedData;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error.response?.data || { detail: 'Failed to fetch assignments' };
    }
  },
  
  // Get assignment by ID
  getAssignment: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/assignments/${id}`);
      const assignment = response.data;
      
      // Получаем локальные данные только если отсутствуют на сервере
      const localData = assignmentsService._getLocalData(id);
      
      if (localData) {
        // Обогащаем данные с сервера, только если они отсутствуют на сервере
        return {
          ...assignment,
          deadline: assignment.deadline || localData.due_date,
          teacher_name: assignment.teacher_name || localData.teacher_name
        };
      }
      
      return assignment;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch assignment details' };
    }
  },
  
  // Submit assignment
  submitAssignment: async (assignmentId, submissionData) => {
    try {
      const response = await axios.post(`${API_URL}/assignments/${assignmentId}/submit`, submissionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to submit assignment' };
    }
  },
  
  // Create assignment (for teachers)
  createAssignment: async (assignmentData) => {
    try {
      // Добавляем информацию о пользователе, если её нет
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!assignmentData.teacher_id && user.id) {
        assignmentData.teacher_id = user.id;
      }
      
      // Определяем имя преподавателя
      if (!assignmentData.teacher_name) {
        if (user.full_name) {
          assignmentData.teacher_name = user.full_name;
        } else if (user.username) {
          assignmentData.teacher_name = user.username;
        } else if (user.email) {
          assignmentData.teacher_name = user.email.split('@')[0];
        }
      }
      
      // Преобразование строки даты в формат ISO для бэкенда
      if (assignmentData.deadline) {
        // Преобразуем YYYY-MM-DD в формат ISO без указания часового пояса
        if (assignmentData.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
          assignmentData.deadline = `${assignmentData.deadline}T23:59:59`;
        }
      }
      
      const response = await axios.post(`${API_URL}/assignments`, assignmentData);
      
      // Сохраняем локальные данные для нового задания
      assignmentsService._saveLocalData(response.data.id, {
        due_date: assignmentData.deadline,
        teacher_name: assignmentData.teacher_name
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create assignment' };
    }
  },
  
  // Upload file to assignment
  uploadFile: async (assignmentId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_URL}/assignments/${assignmentId}/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to upload file' };
    }
  },
  
  // Download file
  downloadFile: async (fileId) => {
    try {
      const response = await axios.get(`${API_URL}/files/${fileId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to download file' };
    }
  },
  
  // Delete file from assignment
  deleteFile: async (assignmentId, fileId) => {
    try {
      await axios.delete(`${API_URL}/assignments/${assignmentId}/files/${fileId}`);
      return true;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete file' };
    }
  },
  
  // Update assignment (for teachers)
  updateAssignment: async (assignmentId, assignmentData) => {
    try {
      // Преобразование строки даты в формат ISO для бэкенда
      if (assignmentData.deadline) {
        // Преобразуем YYYY-MM-DD в формат ISO без указания часового пояса
        if (assignmentData.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const dateObj = new Date(assignmentData.deadline + 'T23:59:59');
          // Удаляем 'Z' с конца строки и информацию о часовом поясе
          assignmentData.deadline = dateObj.toISOString().replace('Z', '');
        }
      } else if (assignmentData.due_date) {
        // Если deadline не задан, но задан due_date
        if (assignmentData.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const dateObj = new Date(assignmentData.due_date + 'T23:59:59');
          // Удаляем 'Z' с конца строки и информацию о часовом поясе
          assignmentData.deadline = dateObj.toISOString().replace('Z', '');
        }
      }
      
      // Сохраняем копию данных перед отправкой
      const originalData = { ...assignmentData };
      
      console.log('Обновление задания с данными:', JSON.stringify(assignmentData, null, 2));
      
      const response = await axios.put(`${API_URL}/assignments/${assignmentId}`, assignmentData);
      
      // Получаем ответ от сервера
      const updatedAssignment = response.data;
      console.log('Получен ответ от сервера:', JSON.stringify(updatedAssignment, null, 2));
      
      // Проверяем, сохранились ли поля на сервере
      const missingDeadline = !updatedAssignment.deadline && (originalData.deadline || originalData.due_date);
      const missingTeacherName = !updatedAssignment.teacher_name && originalData.teacher_name;
      
      // Если какие-то поля не сохранились, сохраняем их локально
      if (missingDeadline || missingTeacherName) {
        const localData = {};
        
        if (missingDeadline) {
          localData.due_date = originalData.deadline || originalData.due_date;
          console.log('Сохраняем дедлайн локально:', localData.due_date);
        }
        
        if (missingTeacherName) {
          localData.teacher_name = originalData.teacher_name;
          console.log('Сохраняем имя преподавателя локально:', originalData.teacher_name);
        }
        
        assignmentsService._saveLocalData(assignmentId, localData);
        
        // Объединяем данные с сервера и локальные данные
        return {
          ...updatedAssignment,
          ...localData
        };
      }
      
      return updatedAssignment;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error.response?.data || { detail: 'Failed to update assignment' };
    }
  },
  
  // Delete assignment (for teachers)
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await axios.delete(`${API_URL}/assignments/${assignmentId}`);
      
      // Удаляем локальные данные для этого задания
      try {
        const storedData = localStorage.getItem('assignmentsLocalData');
        if (storedData) {
          const localData = JSON.parse(storedData);
          
          if (localData[assignmentId]) {
            delete localData[assignmentId];
            localStorage.setItem('assignmentsLocalData', JSON.stringify(localData));
            assignmentsService._localAssignmentData = localData;
          }
        }
      } catch (error) {
        console.error('Ошибка при удалении локальных данных задания:', error);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete assignment' };
    }
  }
};

// Groups service
export const groupsService = {
  // Get all groups
  getGroups: async () => {
    try {
      const response = await axios.get(`${API_URL}/groups`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch groups' };
    }
  }
};

// Attendance service
export const attendanceService = {
  // Get attendance records with optional filtering
  getAttendance: async (params = '') => {
    try {
      console.log('Запрос attendance с параметрами:', params);
      const response = await axios.get(`${API_URL}/attendance${params ? '?' + params : ''}`);
      
      // Проверяем и нормализуем ответ
      const data = response.data;
      console.log('Оригинальный ответ API:', data);
      
      if (!data) {
        console.error('Ответ API пустой');
        return [];
      }
      
      if (!Array.isArray(data)) {
        console.error('Данные не являются массивом:', data);
        try {
          // Пробуем извлечь данные, если они находятся в поле объекта
          if (data.results && Array.isArray(data.results)) {
            console.log('Извлекаем данные из поля results');
            return data.results;
          }
          
          // Если это объект, возвращаем его в массиве
          console.log('Преобразуем объект в массив');
          return [data];
        } catch (e) {
          console.error('Не удалось преобразовать данные:', e);
          return [];
        }
      }
      
      // Преобразуем даты в правильный формат, если нужно
      const normalizedData = data.map(item => {
        if (!item) return null;
        
        // Проверяем наличие необходимых полей
        if (!item.id) {
          console.warn('Элемент не содержит ID:', item);
        }
        
        return {
          ...item,
          // Форматируем дату, если она есть, но в странном формате
          date: item.date ? (item.date.includes('T') ? item.date.split('T')[0] : item.date) : null,
          // Убеждаемся, что поля времени в нужном формате
          start_time: item.start_time || null,
          end_time: item.end_time || null,
          // Нормализуем статус
          status: item.status ? item.status.toLowerCase() : null
        };
      }).filter(item => item !== null); // Удаляем null элементы
      
      console.log('Нормализованные данные о посещаемости:', normalizedData.length, 'записей');
      return normalizedData;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error.response?.data || { detail: 'Failed to fetch attendance records' };
    }
  },
  
  // Get attendance for a specific schedule
  getAttendanceBySchedule: async (scheduleId) => {
    try {
      const response = await axios.get(`${API_URL}/attendance?schedule_id=${scheduleId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching attendance by schedule:', error);
      throw error.response?.data || { detail: 'Failed to fetch attendance for schedule' };
    }
  },
  
  // Get student attendance statistics
  getAttendanceStats: async (studentId = null) => {
    try {
      const url = studentId ? 
        `${API_URL}/attendance/stats?student_id=${studentId}` : 
        `${API_URL}/attendance/stats`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch attendance statistics' };
    }
  },
  
  // Create a single attendance record (for teachers)
  createAttendance: async (attendanceData) => {
    try {
      const response = await axios.post(`${API_URL}/attendance`, attendanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create attendance record' };
    }
  },
  
  // Bulk create/update attendance records (for teachers)
  bulkAttendance: async (bulkData) => {
    try {
      const response = await axios.post(`${API_URL}/attendance/bulk`, bulkData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to process bulk attendance' };
    }
  },
  
  // Update an attendance record (for teachers)
  updateAttendance: async (attendanceId, attendanceData) => {
    try {
      const response = await axios.put(`${API_URL}/attendance/${attendanceId}`, attendanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update attendance record' };
    }
  }
}; 